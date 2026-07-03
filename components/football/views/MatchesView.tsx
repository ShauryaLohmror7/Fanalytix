"use client";

import { useMemo, useState } from "react";
import { PlugZap, Shield } from "lucide-react";
import { useApp } from "@/lib/appState";
import type { Match } from "@/lib/types";
import {
  isInPlay,
  matchDayLabel,
  prettifyStage,
  statusLabel,
} from "@/lib/matchUtils";
import ViewShell from "./ViewShell";
import { CenteredState } from "../LiveMatchPanel";

type Filter = "all" | "live" | "finished" | "upcoming";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "finished", label: "Results" },
  { id: "upcoming", label: "Fixtures" },
];

function Crest({ url }: { url?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-6 w-6 object-contain" />
  ) : (
    <Shield className="h-5 w-5 text-ink-faint" />
  );
}

function MatchRow({ match, onOpen }: { match: Match; onOpen: () => void }) {
  const live = isInPlay(match.status);
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-4 border-b border-white/[0.04] px-6 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.03]"
    >
      <span className="w-24 shrink-0 text-[11px] tabular-nums text-ink-faint">
        {matchDayLabel(match.utcDate)}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
        <span className="truncate text-[13px] font-semibold text-ink">
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </span>
        <Crest url={match.homeTeam.crestUrl} />
      </span>
      <span className="flex w-16 shrink-0 flex-col items-center leading-none">
        <span className="text-[14px] font-black tabular-nums text-ink">
          {match.homeScore != null
            ? `${match.homeScore} – ${match.awayScore ?? 0}`
            : "vs"}
        </span>
        <span
          className={`mt-1 text-[10px] font-semibold ${live ? "text-live" : "text-ink-faint"}`}
        >
          {statusLabel(match)}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Crest url={match.awayTeam.crestUrl} />
        <span className="truncate text-[13px] font-semibold text-ink">
          {match.awayTeam.shortName ?? match.awayTeam.name}
        </span>
      </span>
      <span className="hidden w-28 shrink-0 text-right text-[11px] text-ink-faint lg:block">
        {match.group ?? (match.stage ? prettifyStage(match.stage) : "")}
      </span>
    </button>
  );
}

export default function MatchesView() {
  const { data, selectMatch, openMatchDetail } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const pool = data.seasonMatches.length ? data.seasonMatches : data.todayMatches;

  const filtered = useMemo(() => {
    switch (filter) {
      case "live":
        return pool.filter((m) => isInPlay(m.status));
      case "finished":
        return [...pool.filter((m) => m.status === "FINISHED")].reverse();
      case "upcoming":
        return pool.filter(
          (m) => m.status === "SCHEDULED" || m.status === "TIMED",
        );
      default:
        return pool;
    }
  }, [pool, filter]);

  /** Group by stage, preserving tournament order. */
  const groups = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = m.stage ? prettifyStage(m.stage) : "Schedule";
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <ViewShell
      title="MATCHES"
      subtitle={
        data.configured
          ? `${pool.length} fixtures · FIFA World Cup 2026`
          : undefined
      }
      actions={
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                filter === f.id
                  ? "bg-gold/12 text-gold"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
    >
      {!data.configured ? (
        <CenteredState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connect data provider"
          body="Set WORLDCUP_API_BASE_URL and WORLDCUP_API_KEY to browse the real tournament schedule."
        />
      ) : data.loading && pool.length === 0 ? (
        <div className="flex flex-col gap-2 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="px-6 py-10 text-center text-[12.5px] text-ink-dim">
          No matches in this view.
        </p>
      ) : (
        groups.map(([stage, matches]) => (
          <div key={stage}>
            <div className="sticky top-0 z-10 border-b border-white/[0.05] bg-navy-900/95 px-6 py-2 text-[10.5px] font-bold tracking-[0.18em] text-gold backdrop-blur">
              {stage.toUpperCase()}
              <span className="ml-2 font-medium text-ink-faint">
                {matches.length}
              </span>
            </div>
            {matches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                onOpen={() => {
                  selectMatch(m.id);
                  openMatchDetail(m.id);
                }}
              />
            ))}
          </div>
        ))
      )}
    </ViewShell>
  );
}
