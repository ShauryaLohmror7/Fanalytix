"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  CalendarClock,
  Info,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
import { useApp } from "@/lib/appState";
import {
  isInPlay,
  kickoffTime,
  matchDayLabel,
  stageLabel,
} from "@/lib/matchUtils";
import { TeamCrest } from "./LiveMatchPanel";
import MatchEventRow from "./MatchEventRow";
import StatRow from "./StatRow";

/** Modal with everything the provider really knows about one match. */
export default function MatchDetail() {
  const { detailMatch: match, openMatchDetail, bookmarkIds, toggleBookmark } =
    useApp();

  const live = match ? isInPlay(match.status) : false;
  const bookmarked = match ? bookmarkIds.includes(match.id) : false;

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
          onClick={() => openMatchDetail(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="menu w-[min(520px,94vw)] overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
              <span className="text-[11px] font-bold tracking-[0.16em] text-gold">
                {stageLabel(match) || "WORLD CUP 2026"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark match"}
                  onClick={() => toggleBookmark(match.id)}
                  className={`transition-colors ${bookmarked ? "text-gold" : "text-ink-faint hover:text-gold"}`}
                >
                  <Bookmark
                    className="h-4 w-4"
                    fill={bookmarked ? "currentColor" : "none"}
                  />
                </button>
                <button
                  onClick={() => openMatchDetail(null)}
                  aria-label="Close"
                  className="text-ink-faint hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scoreline */}
            <div className="flex items-start justify-between gap-2 px-6 pb-2 pt-5">
              <div className="flex w-[110px] flex-col items-center gap-2 text-center">
                <TeamCrest team={match.homeTeam} size={48} />
                <span className="text-[11.5px] font-bold uppercase leading-tight tracking-wide text-ink">
                  {match.homeTeam.name}
                </span>
              </div>
              <div className="flex flex-col items-center pt-2">
                {live || match.status === "FINISHED" ? (
                  <div className="text-[36px] font-black leading-none text-ink">
                    {match.homeScore ?? 0}
                    <span className="mx-2 text-ink-faint/60">–</span>
                    {match.awayScore ?? 0}
                  </div>
                ) : (
                  <div className="text-[26px] font-black leading-none text-ink">
                    {kickoffTime(match.utcDate)}
                  </div>
                )}
                <span
                  className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    live ? "bg-live/10 text-live" : "bg-white/5 text-ink-dim"
                  }`}
                >
                  {live
                    ? match.status === "PAUSED"
                      ? "HALF TIME"
                      : "LIVE"
                    : match.status === "FINISHED"
                      ? "FULL TIME"
                      : matchDayLabel(match.utcDate)}
                </span>
                {match.homeScoreHT != null && match.status === "FINISHED" && (
                  <span className="mt-1.5 text-[11px] tabular-nums text-ink-faint">
                    HT {match.homeScoreHT}–{match.awayScoreHT ?? 0}
                  </span>
                )}
              </div>
              <div className="flex w-[110px] flex-col items-center gap-2 text-center">
                <TeamCrest team={match.awayTeam} size={48} />
                <span className="text-[11.5px] font-bold uppercase leading-tight tracking-wide text-ink">
                  {match.awayTeam.name}
                </span>
              </div>
            </div>

            {/* Facts */}
            <div className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-[12px] text-ink-dim">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                {matchDayLabel(match.utcDate)} · {kickoffTime(match.utcDate)}
              </div>
              {match.venue && (
                <div className="flex items-center gap-2 text-[12px] text-ink-dim">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  {match.venue}
                </div>
              )}
              {match.referee && (
                <div className="flex items-center gap-2 text-[12px] text-ink-dim">
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  Referee: {match.referee}
                </div>
              )}
            </div>

            {/* Provider-supplied stats/events when present */}
            {match.statistics?.length ? (
              <div className="border-t border-white/[0.06] px-6 py-4">
                {match.statistics.map((s) => (
                  <StatRow key={s.label} stat={s} />
                ))}
              </div>
            ) : null}
            {match.events?.length ? (
              <div className="border-t border-white/[0.06] px-6 py-4">
                <ul>
                  {match.events.map((event, i) => (
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
              <div className="mx-6 mb-5 flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                <p className="text-[11px] leading-relaxed text-ink-faint">
                  Line-ups, events and statistics aren’t included in the
                  current data plan — FanalytiX shows only verified provider
                  data, never reconstructed match facts.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
