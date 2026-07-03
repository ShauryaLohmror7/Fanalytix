"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiEnvelope, Match, StandingGroup } from "./types";
import { deriveStageLabel, isInPlay } from "./matchUtils";

export interface WorldCupData {
  /** false once we know no provider is configured */
  configured: boolean;
  loading: boolean;
  error?: string;
  liveMatches: Match[];
  todayMatches: Match[];
  /** Whole tournament schedule (season scope), refreshed slowly. */
  seasonMatches: Match[];
  standings: StandingGroup[];
  /** Current tournament stage derived from real match data, or null. */
  stageLabel: string | null;
  /** Best match to feature: first live match, else next upcoming today. */
  featuredMatch: Match | null;
  /** Matches for the bottom ticker: live first, then rest of today. */
  tickerMatches: Match[];
  refresh: () => void;
}

/** Fast cadence for live/today; slow for season/standings (rate limits). */
const FAST_POLL_MS = 45_000;
const SLOW_POLL_MS = 5 * 60_000;

async function fetchEnvelope<T>(url: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as ApiEnvelope<T>;
}

export function useWorldCupData(): WorldCupData {
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [seasonMatches, setSeasonMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingGroup[]>([]);
  const mounted = useRef(true);

  const loadFast = useCallback(async () => {
    try {
      const [live, today] = await Promise.all([
        fetchEnvelope<Match[]>("/api/worldcup/live"),
        fetchEnvelope<Match[]>("/api/worldcup/matches"),
      ]);
      if (!mounted.current) return;
      setConfigured(live.configured && today.configured);
      setLiveMatches(live.data ?? []);
      setTodayMatches(today.data ?? []);
      setError(live.error && today.error ? live.error : undefined);
    } catch {
      if (mounted.current) setError("Unable to reach data service");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const loadSlow = useCallback(async () => {
    try {
      const [season, table] = await Promise.all([
        fetchEnvelope<Match[]>("/api/worldcup/matches?scope=season"),
        fetchEnvelope<StandingGroup[]>("/api/worldcup/standings"),
      ]);
      if (!mounted.current) return;
      setSeasonMatches(season.data ?? []);
      setStandings(table.data ?? []);
    } catch {
      // Non-fatal: season views show their own empty states.
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadFast();
    loadSlow();
    const fast = setInterval(loadFast, FAST_POLL_MS);
    const slow = setInterval(loadSlow, SLOW_POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(fast);
      clearInterval(slow);
    };
  }, [loadFast, loadSlow]);

  const stageLabel = useMemo(
    () =>
      deriveStageLabel(
        seasonMatches.length
          ? seasonMatches
          : [...liveMatches, ...todayMatches],
      ),
    [seasonMatches, liveMatches, todayMatches],
  );

  const featuredMatch = useMemo<Match | null>(() => {
    if (liveMatches.length) return liveMatches[0];
    const upcoming = todayMatches.filter(
      (m) => m.status === "SCHEDULED" || m.status === "TIMED",
    );
    return upcoming[0] ?? todayMatches[0] ?? null;
  }, [liveMatches, todayMatches]);

  const tickerMatches = useMemo<Match[]>(() => {
    const liveIds = new Set(liveMatches.map((m) => m.id));
    return [...liveMatches, ...todayMatches.filter((m) => !liveIds.has(m.id))];
  }, [liveMatches, todayMatches]);

  const refresh = useCallback(() => {
    loadFast();
    loadSlow();
  }, [loadFast, loadSlow]);

  return {
    configured,
    loading,
    error,
    liveMatches,
    todayMatches,
    seasonMatches,
    standings,
    stageLabel,
    featuredMatch,
    tickerMatches,
    refresh,
  };
}

export { isInPlay };
