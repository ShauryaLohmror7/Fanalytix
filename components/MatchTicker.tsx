"use client";

import { motion } from "framer-motion";
import { ChevronRight, PlugZap, RadioTower, Shield } from "lucide-react";
import type { Match, Team } from "@/lib/types";
import { isInPlay, statusLabel, teamCode } from "@/lib/matchUtils";

function CrestMini({ team }: { team: Team }) {
  return team.crestUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.crestUrl}
      alt=""
      width={22}
      height={22}
      className="h-[22px] w-[22px] object-contain"
    />
  ) : (
    <Shield className="h-[20px] w-[20px] text-slate-500" />
  );
}

function TickerCard({ match }: { match: Match }) {
  const live = isInPlay(match.status);
  return (
    <motion.button
      whileHover={{ y: -2 }}
      className={`glass-chip flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${
        live ? "border-neon-green/20 hover:border-neon-green/45" : "hover:border-white/20"
      }`}
    >
      <span className="flex items-center gap-2">
        <CrestMini team={match.homeTeam} />
        <span className="text-[12px] font-bold text-slate-200">
          {teamCode(match.homeTeam)}
        </span>
      </span>

      <span className="flex flex-col items-center leading-none">
        <span className="text-[14px] font-black tabular-nums text-white">
          {match.homeScore != null || match.awayScore != null
            ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
            : "vs"}
        </span>
        <span
          className={`mt-1 text-[10px] font-semibold tabular-nums ${
            live ? "text-neon-green" : "text-slate-500"
          }`}
        >
          {statusLabel(match)}
        </span>
      </span>

      <span className="flex items-center gap-2">
        <span className="text-[12px] font-bold text-slate-200">
          {teamCode(match.awayTeam)}
        </span>
        <CrestMini team={match.awayTeam} />
      </span>
    </motion.button>
  );
}

export default function MatchTicker({
  matches,
  liveCount,
  configured,
  loading,
}: {
  matches: Match[];
  liveCount: number;
  configured: boolean;
  loading: boolean;
}) {
  return (
    <motion.footer
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      className="relative z-20 flex h-[72px] items-center gap-4 border-t border-white/5 bg-black/40 px-5 backdrop-blur-xl"
    >
      {/* Status label */}
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full border ${
            liveCount > 0
              ? "border-neon-red/40 bg-neon-red/10 text-neon-red-bright"
              : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          <RadioTower className={`h-4 w-4 ${liveCount > 0 ? "live-dot-red rounded-full" : ""}`} />
        </span>
        <div className="leading-tight">
          <div className="text-[12px] font-extrabold tracking-wider text-white">
            {liveCount > 0 ? "LIVE NOW" : "MATCHES"}
          </div>
          <div
            className={`text-[11px] font-medium ${
              liveCount > 0 ? "text-neon-red-bright" : "text-slate-400"
            }`}
          >
            {liveCount > 0
              ? `${liveCount} ${liveCount === 1 ? "Match" : "Matches"}`
              : "Today"}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="scroll-slim flex min-w-0 flex-1 items-center gap-3 overflow-x-auto py-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[46px] w-44 shrink-0 animate-pulse rounded-xl bg-white/5"
            />
          ))
        ) : !configured ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-[12px] text-slate-400">
            <PlugZap className="h-4 w-4 text-neon-green" />
            Connect a data provider to stream real World Cup fixtures
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-[12px] text-slate-400">
            No World Cup matches scheduled today
          </div>
        ) : (
          matches.map((m) => <TickerCard key={m.id} match={m} />)
        )}
      </div>

      {/* View all */}
      <button className="glass-chip flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-slate-100 transition-colors hover:border-neon-green/40 hover:text-neon-green">
        View All Matches
        <ChevronRight className="h-4 w-4" />
      </button>
    </motion.footer>
  );
}
