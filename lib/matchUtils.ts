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

export function prettifyStage(stage: string): string {
  return stage
    .toLowerCase()
    .split("_")
    .map((w) => (w === "of" ? "of" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
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
