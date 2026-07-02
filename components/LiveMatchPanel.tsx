"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  ExternalLink,
  PlugZap,
  ShieldAlert,
  TvMinimalPlay,
} from "lucide-react";
import type { Match, Team } from "@/lib/types";
import { isInPlay, kickoffTime, stageLabel, statusLabel, teamCode } from "@/lib/matchUtils";
import StatRow from "./StatRow";
import MatchEventRow from "./MatchEventRow";

/* ------------------------------ crest ------------------------------ */

function TeamCrest({ team, size = 56 }: { team: Team; size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      style={{ width: size + 18, height: size + 18 }}
    >
      {team.crestUrl ? (
        // Plain <img>: provider crests are often SVG, which next/image blocks.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.crestUrl}
          alt={`${team.name} crest`}
          width={size}
          height={size}
          className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        />
      ) : (
        <span className="text-lg font-black tracking-wider text-slate-200">
          {teamCode(team)}
        </span>
      )}
    </div>
  );
}

/* --------------------------- empty states --------------------------- */

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
      className="glass-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl"
    >
      {children}
    </motion.section>
  );
}

function CenteredState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neon-green/20 bg-neon-green/5 text-neon-green">
        {icon}
      </div>
      <div className="text-[14px] font-semibold text-white">{title}</div>
      <p className="max-w-[240px] text-[12px] leading-relaxed text-slate-400">
        {body}
      </p>
    </div>
  );
}

/* ------------------------------ panel ------------------------------ */

export default function LiveMatchPanel({
  match,
  configured,
  loading,
  error,
}: {
  match: Match | null;
  configured: boolean;
  loading: boolean;
  error?: string;
}) {
  const live = match ? isInPlay(match.status) : false;
  const upcoming =
    match && (match.status === "SCHEDULED" || match.status === "TIMED");

  return (
    <PanelShell>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full ${
              live
                ? "bg-neon-red-bright live-dot-red"
                : "bg-slate-500"
            }`}
          />
          <span className="text-[12px] font-bold tracking-[0.18em] text-white">
            {live ? "LIVE MATCH" : upcoming ? "NEXT MATCH" : "MATCH CENTER"}
          </span>
        </div>
        {match && (
          <span className="text-[11px] text-slate-400">{stageLabel(match)}</span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-3 animate-pulse rounded bg-white/5" />
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
          <div className="h-32 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : !configured ? (
        <CenteredState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connect data provider"
          body="Set WORLDCUP_API_BASE_URL and WORLDCUP_API_KEY to stream real FIFA World Cup 2026 matches. FanalytiX never shows fictional fixtures."
        />
      ) : error ? (
        <CenteredState
          icon={<ShieldAlert className="h-5 w-5" />}
          title="No live data available"
          body="The data provider could not be reached. Live match coverage will resume automatically once the connection recovers."
        />
      ) : !match ? (
        <CenteredState
          icon={<CalendarClock className="h-5 w-5" />}
          title="No matches today"
          body="There are no World Cup fixtures scheduled today. Check back on the next matchday."
        />
      ) : (
        <div className="scroll-slim flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Scoreline */}
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex w-[92px] flex-col items-center gap-2 text-center">
                <TeamCrest team={match.homeTeam} />
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-200">
                  {match.homeTeam.shortName ?? match.homeTeam.name}
                </span>
              </div>

              <div className="flex flex-col items-center pt-3">
                <span className="text-[10px] font-semibold tracking-[0.3em] text-slate-500">
                  VS
                </span>
                {live || match.status === "FINISHED" ? (
                  <div className="mt-1 text-[40px] font-black leading-none tracking-tight text-white">
                    {match.homeScore ?? 0}
                    <span className="mx-2 text-slate-600">–</span>
                    {match.awayScore ?? 0}
                  </div>
                ) : (
                  <div className="mt-1 text-[28px] font-black leading-none text-white">
                    {kickoffTime(match.utcDate)}
                  </div>
                )}
                <span
                  className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    live
                      ? "bg-neon-green/10 text-neon-green text-glow-green"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {live
                    ? (match.minute ?? "IN PLAY")
                    : match.status === "FINISHED"
                      ? "FULL TIME"
                      : new Date(match.utcDate).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                </span>
                {live && match.status === "PAUSED" && (
                  <span className="mt-1 text-[10px] tracking-widest text-slate-400">
                    HALF TIME
                  </span>
                )}
              </div>

              <div className="flex w-[92px] flex-col items-center gap-2 text-center">
                <TeamCrest team={match.awayTeam} />
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-200">
                  {match.awayTeam.shortName ?? match.awayTeam.name}
                </span>
              </div>
            </div>

            {/* Momentum strip under scoreline */}
            {live && (
              <div className="mt-4 flex h-1 gap-[2px] overflow-hidden rounded-full">
                <span className="flex-[3] rounded-full bg-neon-green/80 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                <span className="flex-[2] rounded-full bg-neon-red/70" />
              </div>
            )}
            {match.venue && (
              <div className="mt-3 text-center text-[11px] text-slate-500">
                {match.venue}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="border-t border-white/5 px-5 py-4">
            <div className="mb-1 text-[11px] font-bold tracking-[0.18em] text-slate-300">
              MATCH STATS
            </div>
            {match.statistics?.length ? (
              match.statistics.map((s) => <StatRow key={s.label} stat={s} />)
            ) : (
              <p className="py-2 text-[12px] leading-relaxed text-slate-500">
                Detailed statistics aren’t available from the current data
                provider for this match.
              </p>
            )}
          </div>

          {/* Events */}
          <div className="border-t border-white/5 px-5 py-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[0.18em] text-slate-300">
                LIVE EVENTS
              </span>
              {match.events && match.events.length > 0 && (
                <button className="text-[11px] font-medium text-neon-green/80 hover:text-neon-green">
                  View All
                </button>
              )}
            </div>
            {match.events?.length ? (
              <ul>
                {match.events.slice(0, 6).map((event, i) => (
                  <MatchEventRow
                    key={`${event.minute}-${event.type}-${i}`}
                    event={event}
                    match={match}
                    index={i}
                  />
                ))}
              </ul>
            ) : (
              <p className="py-2 text-[12px] leading-relaxed text-slate-500">
                {live
                  ? "No key events recorded yet."
                  : "Events will appear here once the match kicks off."}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="mt-auto flex items-center gap-2 border-t border-white/5 p-4">
            <button className="glass-chip flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-semibold text-slate-100 transition-all hover:border-neon-green/40 hover:text-neon-green">
              <TvMinimalPlay className="h-4 w-4" />
              {live ? "Watch Live" : "Match Preview"}
            </button>
            <button
              aria-label="Open match page"
              className="glass-chip flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-colors hover:text-neon-green"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
