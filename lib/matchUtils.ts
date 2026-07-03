import type { Match, MatchStatus } from "./types";

/** Client-safe match helpers (worldcupApi.ts is server-only). */

export function isInPlay(status: MatchStatus): boolean {
  return status === "IN_PLAY" || status === "LIVE" || status === "PAUSED";
}

export function statusLabel(match: Match): string {
  switch (match.status) {
    case "IN_PLAY":
    case "LIVE":
      return match.minute ?? "LIVE";
    case "PAUSED":
      return "HT";
    case "FINISHED":
      return "FT";
    case "SCHEDULED":
    case "TIMED":
      return kickoffTime(match.utcDate);
    case "POSTPONED":
      return "PP";
    case "SUSPENDED":
      return "SUSP";
    case "CANCELLED":
      return "CANC";
    default:
      return "—";
  }
}

export function kickoffTime(utcDate: string): string {
  try {
    return new Date(utcDate).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function stageLabel(match: Match): string {
  const parts: string[] = [];
  if (match.group) parts.push(match.group);
  else if (match.stage) parts.push(prettifyStage(match.stage));
  if (match.matchday) parts.push(`Matchday ${match.matchday}`);
  return parts.join(" – ");
}

/** Display names for provider stage enum values (fallback: title-case). */
const STAGE_NAMES: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third-place Play-off",
  FINAL: "Final",
};

export function prettifyStage(stage: string): string {
  return (
    STAGE_NAMES[stage] ??
    stage
      .toLowerCase()
      .split("_")
      .map((w) => (w === "of" ? "of" : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ")
  );
}

/**
 * Derives the tournament's current stage label from real match data:
 * stage of a live match, else the next unplayed match, else the most
 * recently finished one. Returns null when nothing is known — callers
 * fall back to a neutral label, never a hardcoded stage.
 */
export function deriveStageLabel(matches: Match[]): string | null {
  if (!matches.length) return null;
  const live = matches.find((m) => isInPlay(m.status));
  if (live?.stage) return prettifyStage(live.stage);
  const upcoming = matches.find(
    (m) => m.status === "SCHEDULED" || m.status === "TIMED",
  );
  if (upcoming?.stage) return prettifyStage(upcoming.stage);
  const finished = [...matches]
    .reverse()
    .find((m) => m.status === "FINISHED" && m.stage);
  return finished?.stage ? prettifyStage(finished.stage) : null;
}

/** "2026-07-02T18:00:00Z" -> "Thu, Jul 2" (local). */
export function matchDayLabel(utcDate: string): string {
  try {
    return new Date(utcDate).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return utcDate.slice(0, 10);
  }
}

/** Short display code for a team: TLA > derived initials. */
export function teamCode(team: { tla?: string; name: string }): string {
  if (team.tla) return team.tla;
  return team.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}
