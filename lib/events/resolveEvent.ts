import { EVENT_REGISTRY, getArenaConfig } from "./registry";
import type { EventProviderState, EventResolution } from "./types";

/**
 * Resolve a free-text query to an event domain.
 *
 * Scoring: each domain counts how many of its matchers hit the query;
 * the highest score wins, ties broken by registry priority (so
 * "SpaceX IPO" goes to markets — an IPO is a market event — while
 * "SpaceX Starship launch" goes to space). No hits → generic.
 *
 * Pure and client-safe: no data fetching. Live provider state (e.g. the
 * football env credentials) can be merged in by the caller — the
 * /api/events/resolve route does exactly that server-side.
 */
export function resolveEvent(
  rawQuery: string,
  providerStates?: EventProviderState[],
): EventResolution {
  const query = rawQuery.trim();
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, " ");

  let best: { id: (typeof EVENT_REGISTRY)[number]["id"]; score: number; priority: number } = {
    id: "generic",
    score: 0,
    priority: 0,
  };

  for (const config of EVENT_REGISTRY) {
    const score = config.matchers.filter((re) => re.test(normalizedQuery)).length;
    if (
      score > best.score ||
      (score > 0 && score === best.score && config.priority > best.priority)
    ) {
      best = { id: config.id, score, priority: config.priority };
    }
  }

  const config = getArenaConfig(best.id);

  const liveState = providerStates?.find((s) => s.domain === config.id);
  const providerConfigured =
    liveState?.configured ?? config.providerStatus === "connected";

  const available = config.available;

  return {
    query,
    normalizedQuery,
    domain: config.id,
    arenaId: available ? config.id : "generic",
    available,
    providerConfigured,
    reason:
      best.score > 0
        ? `Matched the ${config.label} arena (${best.score} signal${best.score > 1 ? "s" : ""}) — ${
            available ? "open" : "being prepared"
          }.`
        : "No arena recognised this query yet — held in the Observatory.",
    suggestedAction: available
      ? `Enter the ${config.label} arena.`
      : `Witness it in the coming-soon shell; the ${config.label} arena ships with a real provider.`,
  };
}
