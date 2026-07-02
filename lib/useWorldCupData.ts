"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiEnvelope, Match } from "./types";
import { isInPlay } from "./matchUtils";

export interface WorldCupData {
  /** false once we know no provider is configured */
  configured: boolean;
  loading: boolean;
  error?: string;
  liveMatches: Match[];
  todayMatches: Match[];
  /** Best match to feature: first live match, else next upcoming today. */
  featuredMatch: Match | null;
  /** Matches for the bottom ticker: live first, then rest of today. */
  tickerMatches: Match[];
  refresh: () => void;
}

const LIVE_POLL_MS = 30_000;
const TODAY_POLL_MS = 120_000;

async function fetchEnvelope(url: string): Promise<ApiEnvelope<Match[]>> {
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as ApiEnvelope<Match[]>;
}

export function useWorldCupData(): WorldCupData {
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const [live, today] = await Promise.all([
        fetchEnvelope("/api/worldcup/live"),
        fetchEnvelope("/api/worldcup/matches"),
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

  useEffect(() => {
    mounted.current = true;
    load();
    const liveTimer = setInterval(load, LIVE_POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(liveTimer);
    };
  }, [load]);

  // Deliberately separate slower cadence isn't needed — a single 30s poll
  // covers both endpoints and the server caches upstream calls.
  void TODAY_POLL_MS;

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

  return {
    configured,
    loading,
    error,
    liveMatches,
    todayMatches,
    featuredMatch,
    tickerMatches,
    refresh: load,
  };
}

export { isInPlay };
