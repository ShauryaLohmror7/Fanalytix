/**
 * Normalized domain types for FanalytiX.
 *
 * Every football data provider is mapped into these shapes inside
 * lib/worldcupApi.ts, so the UI never depends on a provider's raw schema.
 * Fields a provider cannot supply are left undefined and the UI degrades
 * gracefully.
 */

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "LIVE"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "UNKNOWN";

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  /** Three-letter code, e.g. "BRA" */
  tla?: string;
  crestUrl?: string;
}

export type MatchEventType =
  | "GOAL"
  | "OWN_GOAL"
  | "PENALTY_GOAL"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "SUBSTITUTION";

export interface MatchEvent {
  /** Match minute, e.g. "45+1" */
  minute: string;
  type: MatchEventType;
  team: "HOME" | "AWAY";
  /** Primary player (scorer, carded player, player coming on) */
  player?: string;
  /** Secondary player (assist, or the player going off in a sub) */
  playerSecondary?: string;
}

export interface MatchStatistic {
  label: string;
  home: number;
  away: number;
  /** Render values as percentages (possession, pass accuracy…) */
  isPercentage?: boolean;
}

export interface Match {
  id: string;
  status: MatchStatus;
  /** Human-friendly minute, e.g. "78'" — only when in play and provided */
  minute?: string;
  utcDate: string;
  /** e.g. "GROUP_STAGE", "ROUND_OF_16" */
  stage?: string;
  /** e.g. "Group A" */
  group?: string;
  matchday?: number;
  venue?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  /** Half-time score, when the provider supplies it */
  homeScoreHT?: number;
  awayScoreHT?: number;
  referee?: string;
  events?: MatchEvent[];
  statistics?: MatchStatistic[];
}

export interface StandingRow {
  position: number;
  team: Team;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalDifference: number;
  points: number;
}

export interface StandingGroup {
  group: string;
  rows: StandingRow[];
}

/**
 * Envelope returned by every API route. `configured: false` means no data
 * provider credentials are present — the UI must show a "connect data
 * provider" state, never invented data.
 */
export interface ApiEnvelope<T> {
  configured: boolean;
  data: T | null;
  error?: string;
  fetchedAt: string;
}

/* ---------------- Sentiment (placeholder until a social API is wired) ---- */

export type SentimentSource = "simulated" | "live";

export interface SentimentPoint {
  /** Minutes ago, 0 = now */
  minutesAgo: number;
  positive: number;
  negative: number;
  neutral: number;
  volume: number;
}

export interface TrendingTopic {
  tag: string;
  posts: number;
  /** Rank change vs previous window */
  delta: number;
}

export interface SocialPost {
  id: string;
  author: string;
  handle: string;
  minutesAgo: number;
  text: string;
  tag?: string;
  likes: number;
  reposts: number;
  replies: number;
  impressions: number;
  verified?: boolean;
}

export interface SentimentSnapshot {
  source: SentimentSource;
  positive: number;
  negative: number;
  neutral: number;
  trendDeltaPct: number;
  volumeDeltaPct: number;
  series: SentimentPoint[];
  topics: TrendingTopic[];
  posts: SocialPost[];
}
