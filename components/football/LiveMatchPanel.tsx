"use client";

import { motion } from "framer-motion";
import {
  Bookmark,
  CalendarClock,
  Check,
  Copy,
  Info,
  MapPin,
  PlugZap,
  ScrollText,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import type { Match, Team } from "@/lib/types";
import {
  isInPlay,
  kickoffTime,
  matchDayLabel,
  stageLabel,
  teamCode,
} from "@/lib/matchUtils";
import { useApp } from "@/lib/appState";
import StatRow from "./StatRow";
import MatchEventRow from "./MatchEventRow";

/* ------------------------------ crest ------------------------------ */

export function TeamCrest({ team, size = 56 }: { team: Team; size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] shadow-[0_8px_24px_rgba(2,6,16,0.5)]"
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
          className="object-contain drop-shadow-[0_2px_8px_rgba(2,6,16,0.6)]"
        />
      ) : (
        <span className="text-lg font-black tracking-wider text-ink">
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
      className="panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl"
    >
      {children}
    </motion.section>
  );
}

export function CenteredState({
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
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/5 text-gold">
        {icon}
      </div>
      <div className="text-[14px] font-semibold text-ink">{title}</div>
      <p className="max-w-[240px] text-[12px] leading-relaxed text-ink-dim">
        {body}
      </p>
    </div>
  );
}

/* --------------------------- info rows --------------------------- */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-ink-faint">
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </div>
        <div className="truncate text-[12.5px] font-medium text-ink">
          {value}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ panel ------------------------------ */

export default function LiveMatchPanel() {
  const { data, featuredMatch, openMatchDetail, bookmarkIds, toggleBookmark } =
    useApp();
  const { configured, loading, error } = data;
  const match = featuredMatch;
  const [copied, setCopied] = useState(false);

  const live = match ? isInPlay(match.status) : false;
  const upcoming =
    match && (match.status === "SCHEDULED" || match.status === "TIMED");
  const bookmarked = match ? bookmarkIds.includes(match.id) : false;

  const copySummary = async () => {
    if (!match) return;
    const score =
      match.homeScore != null
        ? `${match.homeScore}-${match.awayScore ?? 0}`
        : "vs";
    try {
      await navigator.clipboard.writeText(
        `${match.homeTeam.name} ${score} ${match.awayTeam.name} — ${stageLabel(match)} · ${matchDayLabel(match.utcDate)} · World Cup 2026`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions) — leave button state unchanged.
    }
  };

  return (
    <PanelShell>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full ${
              live ? "live-dot bg-live" : "bg-ink-faint"
            }`}
          />
          <span className="font-royal text-[12px] font-bold tracking-[0.18em] text-gold-sheen">
            {live ? "LIVE MATCH" : upcoming ? "NEXT MATCH" : "MATCH CENTER"}
          </span>
        </div>
        {match && (
          <span className="text-[11px] text-gold/90">{stageLabel(match)}</span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-3 animate-pulse rounded bg-white/5" />
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
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
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide text-ink">
                  {match.homeTeam.shortName ?? match.homeTeam.name}
                </span>
              </div>

              <div className="flex flex-col items-center pt-3">
                <span className="text-[10px] font-semibold tracking-[0.3em] text-ink-faint">
                  VS
                </span>
                {live || match.status === "FINISHED" ? (
                  <div className="mt-1 text-[40px] font-black leading-none tracking-tight text-ink">
                    {match.homeScore ?? 0}
                    <span className="mx-2 text-ink-faint/60">–</span>
                    {match.awayScore ?? 0}
                  </div>
                ) : (
                  <div className="mt-1 text-[28px] font-black leading-none text-ink">
                    {kickoffTime(match.utcDate)}
                  </div>
                )}
                <span
                  className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    live
                      ? "bg-live/10 text-live"
                      : "bg-white/5 text-ink-dim"
                  }`}
                >
                  {live
                    ? match.status === "PAUSED"
                      ? "HALF TIME"
                      : (match.minute ?? "IN PLAY")
                    : match.status === "FINISHED"
                      ? "FULL TIME"
                      : matchDayLabel(match.utcDate)}
                </span>
                {/* Real half-time score when the provider supplies it */}
                {match.homeScoreHT != null && match.status === "FINISHED" && (
                  <span className="mt-1.5 text-[11px] tabular-nums text-ink-faint">
                    HT {match.homeScoreHT}–{match.awayScoreHT ?? 0}
                  </span>
                )}
              </div>

              <div className="flex w-[92px] flex-col items-center gap-2 text-center">
                <TeamCrest team={match.awayTeam} />
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide text-ink">
                  {match.awayTeam.shortName ?? match.awayTeam.name}
                </span>
              </div>
            </div>
          </div>

          {/* Match information — every field is real provider data */}
          <div className="border-t border-white/[0.06] px-5 py-4">
            <div className="mb-1 text-[11px] font-bold tracking-[0.18em] text-ink-dim">
              MATCH INFO
            </div>
            <InfoRow
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              label="Kickoff"
              value={`${matchDayLabel(match.utcDate)} · ${kickoffTime(match.utcDate)}`}
            />
            {match.venue && (
              <InfoRow
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Venue"
                value={match.venue}
              />
            )}
            {match.referee && (
              <InfoRow
                icon={<UserRound className="h-3.5 w-3.5" />}
                label="Referee"
                value={match.referee}
              />
            )}
          </div>

          {/* Stats & events only when the provider actually supplies them */}
          {match.statistics?.length ? (
            <div className="border-t border-white/[0.06] px-5 py-4">
              <div className="mb-1 text-[11px] font-bold tracking-[0.18em] text-ink-dim">
                MATCH STATS
              </div>
              {match.statistics.map((s) => (
                <StatRow key={s.label} stat={s} />
              ))}
            </div>
          ) : null}

          {match.events?.length ? (
            <div className="border-t border-white/[0.06] px-5 py-4">
              <div className="mb-1 text-[11px] font-bold tracking-[0.18em] text-ink-dim">
                KEY EVENTS
              </div>
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
            </div>
          ) : (
            <div className="mx-5 mt-1 flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Per-match events, live minute and statistics aren’t included
                in the current data plan.
              </p>
            </div>
          )}

          {/* Actions — all functional */}
          <div className="mt-auto flex items-center gap-2 border-t border-white/[0.06] p-4">
            <button
              onClick={() => openMatchDetail(match.id)}
              className="chip flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-semibold text-ink transition-colors hover:text-gold"
            >
              <ScrollText className="h-4 w-4" />
              Match Details
            </button>
            <button
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark match"}
              title={bookmarked ? "Remove bookmark" : "Bookmark match (this session)"}
              onClick={() => toggleBookmark(match.id)}
              className={`chip flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                bookmarked ? "text-gold" : "text-ink-dim hover:text-gold"
              }`}
            >
              <Bookmark
                className="h-4 w-4"
                fill={bookmarked ? "currentColor" : "none"}
              />
            </button>
            <button
              aria-label="Copy match summary"
              title="Copy match summary"
              onClick={copySummary}
              className="chip flex h-10 w-10 items-center justify-center rounded-xl text-ink-dim transition-colors hover:text-gold"
            >
              {copied ? (
                <Check className="h-4 w-4 text-live" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
