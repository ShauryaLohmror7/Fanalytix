"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CornerDownLeft, Search, Shield, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, type ViewId } from "@/lib/appState";
import type { Match, Team } from "@/lib/types";
import { matchDayLabel, statusLabel, teamCode } from "@/lib/matchUtils";

interface TeamHit {
  team: Team;
  matchCount: number;
}

/**
 * ⌘K palette over the real loaded dataset: searches tournament teams and
 * fixtures, plus quick view navigation. No provider = honest empty hint.
 */
export default function CommandPalette() {
  const {
    paletteOpen,
    setPaletteOpen,
    data,
    selectMatch,
    setView,
    openMatchDetail,
  } = useApp();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      // Focus after the enter animation mounts the input.
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [paletteOpen]);

  const pool = data.seasonMatches.length
    ? data.seasonMatches
    : [...data.liveMatches, ...data.todayMatches];

  const { teams, matches } = useMemo(() => {
    const q = query.trim().toLowerCase();

    const byTeam = new Map<string, TeamHit>();
    for (const m of pool) {
      for (const t of [m.homeTeam, m.awayTeam]) {
        if (!t.id) continue;
        const hit = byTeam.get(t.id) ?? { team: t, matchCount: 0 };
        hit.matchCount++;
        byTeam.set(t.id, hit);
      }
    }

    const teamHits = [...byTeam.values()]
      .filter(
        (h) =>
          !q ||
          h.team.name.toLowerCase().includes(q) ||
          h.team.tla?.toLowerCase().includes(q) ||
          h.team.shortName?.toLowerCase().includes(q),
      )
      .sort((a, b) => a.team.name.localeCompare(b.team.name))
      .slice(0, 5);

    const matchHits = pool
      .filter(
        (m) =>
          !q ||
          m.homeTeam.name.toLowerCase().includes(q) ||
          m.awayTeam.name.toLowerCase().includes(q) ||
          m.homeTeam.tla?.toLowerCase().includes(q) ||
          m.awayTeam.tla?.toLowerCase().includes(q),
      )
      .slice(0, 6);

    return { teams: teamHits, matches: matchHits };
  }, [pool, query]);

  const allShortcuts: Array<{ label: string; view: ViewId }> = [
    { label: "Overview", view: "overview" },
    { label: "Matches", view: "matches" },
    { label: "Teams & Standings", view: "teams" },
    { label: "Sentiment", view: "sentiment" },
    { label: "Insights", view: "insights" },
  ];
  const viewShortcuts = allShortcuts.filter(
    (v) => !query || v.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const pickMatch = (m: Match) => {
    selectMatch(m.id);
    openMatchDetail(m.id);
    setPaletteOpen(false);
  };

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-start justify-center bg-navy-950/70 pt-[12vh] backdrop-blur-sm"
          onClick={() => setPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="menu w-[min(560px,92vw)] overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-gold" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams, matches, views…"
                className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
              />
              <button
                onClick={() => setPaletteOpen(false)}
                aria-label="Close"
                className="text-ink-faint hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="scroll-slim max-h-[50vh] overflow-y-auto p-2">
              {!data.configured ? (
                <p className="px-3 py-6 text-center text-[12.5px] text-ink-dim">
                  Connect a data provider to search real World Cup teams and
                  fixtures.
                </p>
              ) : (
                <>
                  {teams.length > 0 && (
                    <>
                      <div className="px-3 pb-1 pt-2 text-[10px] font-bold tracking-[0.16em] text-ink-faint">
                        TEAMS
                      </div>
                      {teams.map(({ team, matchCount }) => (
                        <button
                          key={team.id}
                          onClick={() => {
                            setView("teams");
                            setPaletteOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5"
                        >
                          {team.crestUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={team.crestUrl}
                              alt=""
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <Shield className="h-5 w-5 text-ink-faint" />
                          )}
                          <span className="text-[13px] font-medium text-ink">
                            {team.name}
                          </span>
                          <span className="ml-auto text-[11px] text-ink-faint">
                            {matchCount} {matchCount === 1 ? "match" : "matches"}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {matches.length > 0 && (
                    <>
                      <div className="px-3 pb-1 pt-2 text-[10px] font-bold tracking-[0.16em] text-ink-faint">
                        MATCHES
                      </div>
                      {matches.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => pickMatch(m)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5"
                        >
                          <CalendarDays className="h-4 w-4 shrink-0 text-ink-faint" />
                          <span className="text-[13px] text-ink">
                            {teamCode(m.homeTeam)}
                            <span className="mx-1.5 text-ink-faint">
                              {m.homeScore != null
                                ? `${m.homeScore}–${m.awayScore ?? 0}`
                                : "vs"}
                            </span>
                            {teamCode(m.awayTeam)}
                          </span>
                          <span className="ml-auto text-[11px] tabular-nums text-ink-faint">
                            {matchDayLabel(m.utcDate)} · {statusLabel(m)}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {viewShortcuts.length > 0 && (
                    <>
                      <div className="px-3 pb-1 pt-2 text-[10px] font-bold tracking-[0.16em] text-ink-faint">
                        GO TO
                      </div>
                      {viewShortcuts.map((v) => (
                        <button
                          key={v.view}
                          onClick={() => {
                            setView(v.view);
                            setPaletteOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5"
                        >
                          <CornerDownLeft className="h-3.5 w-3.5 text-ink-faint" />
                          <span className="text-[13px] text-ink-dim">
                            {v.label}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {teams.length === 0 &&
                    matches.length === 0 &&
                    viewShortcuts.length === 0 && (
                      <p className="px-3 py-6 text-center text-[12.5px] text-ink-faint">
                        No results for “{query}”.
                      </p>
                    )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
