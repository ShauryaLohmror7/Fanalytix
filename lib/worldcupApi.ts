import "server-only";

import type {
  Match,
  MatchEvent,
  MatchStatistic,
  MatchStatus,
  StandingGroup,
  Team,
} from "./types";

/**
 * Provider abstraction for World Cup data.
 *
 * The rest of the app only talks to `getWorldCupProvider()`. To swap
 * providers, implement `WorldCupProvider` for the new vendor and return it
 * from the factory — no UI changes required.
 *
 * Env vars (server-side only, never exposed to the client):
 *   WORLDCUP_API_BASE_URL   e.g. https://api.football-data.org/v4
 *   WORLDCUP_API_KEY        provider token
 *   WORLDCUP_COMPETITION_CODE  optional, defaults to "WC"
 */
export interface WorldCupProvider {
  readonly name: string;
  /** Matches currently in play (with events/stats when available). */
  getLiveMatches(): Promise<Match[]>;
  /** All of today's matches (any status), ordered by kickoff. */
  getTodayMatches(): Promise<Match[]>;
  /** Group standings, when the provider supports them. */
  getStandings(): Promise<StandingGroup[]>;
}

export function isProviderConfigured(): boolean {
  return Boolean(
    process.env.WORLDCUP_API_BASE_URL && process.env.WORLDCUP_API_KEY,
  );
}

/**
 * Returns the configured provider, or null when credentials are missing.
 * Callers must translate null into a "connect data provider" UI state.
 */
export function getWorldCupProvider(): WorldCupProvider | null {
  if (!isProviderConfigured()) return null;
  return new FootballDataProvider(
    process.env.WORLDCUP_API_BASE_URL!,
    process.env.WORLDCUP_API_KEY!,
    process.env.WORLDCUP_COMPETITION_CODE ?? "WC",
  );
}

/* ------------------------------------------------------------------ */
/* football-data.org v4 compatible provider                            */
/* ------------------------------------------------------------------ */

/** Loose raw shapes — every field is optional so partial payloads never throw. */
type RawTeam = {
  id?: number | string;
  name?: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  crestUrl?: string;
};

type RawPlayer = { name?: string } | null;

type RawMatch = {
  id?: number | string;
  utcDate?: string;
  status?: string;
  minute?: number | string | null;
  stage?: string;
  group?: string | null;
  matchday?: number;
  venue?: string;
  homeTeam?: RawTeam;
  awayTeam?: RawTeam;
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
  };
  goals?: Array<{
    minute?: number;
    injuryTime?: number | null;
    type?: string;
    team?: { id?: number | string };
    scorer?: RawPlayer;
    assist?: RawPlayer;
  }>;
  bookings?: Array<{
    minute?: number;
    team?: { id?: number | string };
    player?: RawPlayer;
    card?: string;
  }>;
  substitutions?: Array<{
    minute?: number;
    team?: { id?: number | string };
    playerIn?: RawPlayer;
    playerOut?: RawPlayer;
  }>;
  statistics?: Record<string, { home?: number; away?: number }>;
};

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "SCHEDULED",
  TIMED: "TIMED",
  IN_PLAY: "IN_PLAY",
  LIVE: "LIVE",
  PAUSED: "PAUSED",
  FINISHED: "FINISHED",
  SUSPENDED: "SUSPENDED",
  POSTPONED: "POSTPONED",
  CANCELLED: "CANCELLED",
};

export function isInPlay(status: MatchStatus): boolean {
  return status === "IN_PLAY" || status === "LIVE" || status === "PAUSED";
}

class FootballDataProvider implements WorldCupProvider {
  readonly name = "football-data";

  constructor(
    private baseUrl: string,
    private apiKey: string,
    private competition: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(path: string, revalidateSeconds: number): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { "X-Auth-Token": this.apiKey },
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) {
      throw new Error(`Provider responded ${res.status} for ${path}`);
    }
    return (await res.json()) as T;
  }

  async getLiveMatches(): Promise<Match[]> {
    const payload = await this.request<{ matches?: RawMatch[] }>(
      `/competitions/${this.competition}/matches?status=IN_PLAY,PAUSED`,
      20,
    );
    const matches = (payload.matches ?? []).map((m) => this.mapMatch(m));
    // The list endpoint omits events; enrich the matches in play with the
    // detail endpoint, tolerating providers/plans that don't expose it.
    return Promise.all(matches.map((m) => this.enrichMatch(m)));
  }

  async getTodayMatches(): Promise<Match[]> {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const payload = await this.request<{ matches?: RawMatch[] }>(
      `/competitions/${this.competition}/matches?dateFrom=${fmt(today)}&dateTo=${fmt(tomorrow)}`,
      60,
    );
    return (payload.matches ?? [])
      .map((m) => this.mapMatch(m))
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  }

  async getStandings(): Promise<StandingGroup[]> {
    const payload = await this.request<{
      standings?: Array<{
        group?: string | null;
        type?: string;
        table?: Array<{
          position?: number;
          team?: RawTeam;
          playedGames?: number;
          won?: number;
          draw?: number;
          lost?: number;
          goalDifference?: number;
          points?: number;
        }>;
      }>;
    }>(`/competitions/${this.competition}/standings`, 600);

    return (payload.standings ?? [])
      .filter((s) => !s.type || s.type === "TOTAL")
      .map((s) => ({
        group: prettifyGroup(s.group ?? ""),
        rows: (s.table ?? []).map((r) => ({
          position: r.position ?? 0,
          team: mapTeam(r.team),
          played: r.playedGames ?? 0,
          won: r.won ?? 0,
          draw: r.draw ?? 0,
          lost: r.lost ?? 0,
          goalDifference: r.goalDifference ?? 0,
          points: r.points ?? 0,
        })),
      }));
  }

  private async enrichMatch(match: Match): Promise<Match> {
    try {
      const raw = await this.request<RawMatch>(`/matches/${match.id}`, 20);
      const detailed = this.mapMatch(raw);
      return {
        ...match,
        events: detailed.events?.length ? detailed.events : match.events,
        statistics: detailed.statistics?.length
          ? detailed.statistics
          : match.statistics,
        minute: detailed.minute ?? match.minute,
      };
    } catch {
      // Detail endpoint unavailable on this plan/provider — keep list data.
      return match;
    }
  }

  private mapMatch(raw: RawMatch): Match {
    const homeId = String(raw.homeTeam?.id ?? "home");
    const status = STATUS_MAP[raw.status ?? ""] ?? "UNKNOWN";

    const side = (teamId?: number | string): "HOME" | "AWAY" =>
      String(teamId ?? "") === homeId ? "HOME" : "AWAY";

    const events: MatchEvent[] = [];
    for (const g of raw.goals ?? []) {
      events.push({
        minute: formatMinute(g.minute, g.injuryTime),
        type:
          g.type === "OWN" ? "OWN_GOAL" : g.type === "PENALTY" ? "PENALTY_GOAL" : "GOAL",
        team: side(g.team?.id),
        player: g.scorer?.name,
        playerSecondary: g.assist?.name ?? undefined,
      });
    }
    for (const b of raw.bookings ?? []) {
      events.push({
        minute: formatMinute(b.minute),
        type: b.card === "RED" || b.card === "SECOND_YELLOW" ? "RED_CARD" : "YELLOW_CARD",
        team: side(b.team?.id),
        player: b.player?.name,
      });
    }
    for (const s of raw.substitutions ?? []) {
      events.push({
        minute: formatMinute(s.minute),
        type: "SUBSTITUTION",
        team: side(s.team?.id),
        player: s.playerIn?.name,
        playerSecondary: s.playerOut?.name,
      });
    }
    events.sort((a, b) => parseMinute(b.minute) - parseMinute(a.minute));

    return {
      id: String(raw.id ?? ""),
      status,
      minute:
        isInPlay(status) && raw.minute != null && raw.minute !== ""
          ? `${raw.minute}'`
          : undefined,
      utcDate: raw.utcDate ?? new Date().toISOString(),
      stage: raw.stage,
      group: raw.group ? prettifyGroup(raw.group) : undefined,
      matchday: raw.matchday,
      venue: raw.venue,
      homeTeam: mapTeam(raw.homeTeam),
      awayTeam: mapTeam(raw.awayTeam),
      homeScore: raw.score?.fullTime?.home ?? undefined,
      awayScore: raw.score?.fullTime?.away ?? undefined,
      events: events.length ? events : undefined,
      statistics: mapStatistics(raw.statistics),
    };
  }
}

/* ------------------------------ helpers ------------------------------ */

function mapTeam(raw?: RawTeam): Team {
  return {
    id: String(raw?.id ?? ""),
    name: raw?.name ?? "TBD",
    shortName: raw?.shortName,
    tla: raw?.tla,
    crestUrl: raw?.crest ?? raw?.crestUrl,
  };
}

function formatMinute(minute?: number, injuryTime?: number | null): string {
  if (minute == null) return "—";
  return injuryTime ? `${minute}+${injuryTime}'` : `${minute}'`;
}

function parseMinute(minute: string): number {
  const [base, extra] = minute.replace("'", "").split("+");
  return (parseInt(base, 10) || 0) + (parseInt(extra ?? "0", 10) || 0) / 10;
}

function prettifyGroup(group: string): string {
  // "GROUP_A" -> "Group A"
  return group
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const STAT_LABELS: Record<string, { label: string; isPercentage?: boolean }> = {
  ball_possession: { label: "Possession", isPercentage: true },
  shots: { label: "Shots" },
  shots_on_goal: { label: "Shots on Target" },
  corner_kicks: { label: "Corners" },
  fouls: { label: "Fouls" },
  yellow_cards: { label: "Yellow Cards" },
  red_cards: { label: "Red Cards" },
  pass_accuracy: { label: "Pass Accuracy", isPercentage: true },
  saves: { label: "Saves" },
  offsides: { label: "Offsides" },
};

function mapStatistics(
  raw?: Record<string, { home?: number; away?: number }>,
): MatchStatistic[] | undefined {
  if (!raw) return undefined;
  const stats: MatchStatistic[] = [];
  for (const [key, def] of Object.entries(STAT_LABELS)) {
    const entry = raw[key];
    if (entry && (entry.home != null || entry.away != null)) {
      stats.push({
        label: def.label,
        home: entry.home ?? 0,
        away: entry.away ?? 0,
        isPercentage: def.isPercentage,
      });
    }
  }
  return stats.length ? stats : undefined;
}
