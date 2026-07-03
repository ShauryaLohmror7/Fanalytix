"use client";

import { motion } from "framer-motion";
import { ChevronRight, Clock, PlugZap, Shield } from "lucide-react";
import { useApp } from "@/lib/appState";
import type { Match, Team } from "@/lib/types";
import { isInPlay, matchDayLabel, statusLabel, stageLabel } from "@/lib/matchUtils";

function Crest({ team }: { team: Team }) {
  return team.crestUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.crestUrl}
      alt=""
      width={26}
      height={26}
      className="h-[26px] w-[26px] object-contain drop-shadow-[0_1px_3px_rgba(4,8,24,0.6)]"
    />
  ) : (
    <Shield className="h-[22px] w-[22px] text-ink-faint" />
  );
}

/** Ornate fixture card — engraved gold frame, real match inside. */
function FixtureCard({
  match,
  selected,
  onSelect,
}: {
  match: Match;
  selected: boolean;
  onSelect: () => void;
}) {
  const live = isInPlay(match.status);
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onSelect}
      aria-pressed={selected}
      className={`panel group relative min-w-0 flex-1 rounded-xl px-4 py-2.5 text-left transition-shadow ${
        selected ? "gold-glow" : ""
      }`}
    >
      {/* Stage line */}
      <div className="flex items-center justify-between">
        <span className="font-royal truncate text-[9.5px] font-semibold uppercase tracking-[0.22em] text-gold/90">
          {stageLabel(match) || "World Cup 2026"}
        </span>
        {live && (
          <span className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-live" />
        )}
      </div>

      {/* Teams */}
      <div className="mt-1.5 flex items-center gap-2.5">
        <Crest team={match.homeTeam} />
        <span className="truncate text-[12.5px] font-semibold text-ink">
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </span>
        <span className="shrink-0 text-[12px] font-black tabular-nums text-gold-bright">
          {match.homeScore != null || match.awayScore != null
            ? `${match.homeScore ?? 0}–${match.awayScore ?? 0}`
            : "vs"}
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-[12.5px] font-semibold text-ink">
          {match.awayTeam.shortName ?? match.awayTeam.name}
        </span>
        <Crest team={match.awayTeam} />
      </div>

      {/* Time line */}
      <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-ink-faint">
        <Clock className="h-3 w-3" />
        {live ? (
          <span className="font-semibold text-live">{statusLabel(match)}</span>
        ) : (
          <span>
            {matchDayLabel(match.utcDate)} · {statusLabel(match)}
          </span>
        )}
      </div>
    </motion.button>
  );
}

/** Bottom row: three featured real fixtures + the doorway to all matches. */
export default function MatchTicker() {
  const { data, selectedMatchId, selectMatch, featuredMatch, setView } =
    useApp();
  const { tickerMatches, configured, loading } = data;
  const activeId = selectedMatchId ?? featuredMatch?.id;
  const featured = tickerMatches.slice(0, 3);

  return (
    <motion.footer
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      className="relative z-20 flex items-stretch gap-3 px-4 pb-4 pt-1"
    >
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[86px] flex-1 animate-pulse rounded-xl bg-white/5"
          />
        ))
      ) : !configured ? (
        <div className="panel flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-6 text-[12px] text-ink-dim">
          <PlugZap className="h-4 w-4 text-gold" />
          Connect a data provider to stream real World Cup fixtures
        </div>
      ) : featured.length === 0 ? (
        <div className="panel flex-1 rounded-xl px-4 py-6 text-center text-[12px] text-ink-dim">
          No World Cup matches scheduled today
        </div>
      ) : (
        featured.map((m) => (
          <FixtureCard
            key={m.id}
            match={m}
            selected={m.id === activeId}
            onSelect={() => selectMatch(m.id)}
          />
        ))
      )}

      <button
        onClick={() => setView("matches")}
        aria-label="View all matches"
        title="View all matches"
        className="liquid-btn flex w-12 shrink-0 items-center justify-center rounded-xl text-gold"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </motion.footer>
  );
}
