"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarClock, Radio, Trophy, X } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "@/lib/appState";
import type { Match } from "@/lib/types";
import { isInPlay, kickoffTime, matchDayLabel, teamCode } from "@/lib/matchUtils";

interface Notice {
  id: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  match: Match;
}

/**
 * Notification feed assembled from the real loaded dataset: matches in
 * play, final scores from the last 24h, and kickoffs in the next 24h.
 */
export default function NotificationsDrawer() {
  const { notificationsOpen, setNotificationsOpen, data, selectMatch, openMatchDetail } =
    useApp();

  const notices = useMemo<Notice[]>(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const pool = data.seasonMatches.length
      ? data.seasonMatches
      : [...data.liveMatches, ...data.todayMatches];

    const list: Notice[] = [];

    for (const m of pool.filter((m) => isInPlay(m.status))) {
      list.push({
        id: `live-${m.id}`,
        icon: <Radio className="h-4 w-4 text-live" />,
        title: `${teamCode(m.homeTeam)} ${m.homeScore ?? 0}–${m.awayScore ?? 0} ${teamCode(m.awayTeam)}`,
        detail: "Live now",
        match: m,
      });
    }

    for (const m of pool.filter(
      (m) =>
        m.status === "FINISHED" &&
        now - new Date(m.utcDate).getTime() < dayMs,
    )) {
      list.push({
        id: `ft-${m.id}`,
        icon: <Trophy className="h-4 w-4 text-gold" />,
        title: `${m.homeTeam.shortName ?? m.homeTeam.name} ${m.homeScore ?? 0}–${m.awayScore ?? 0} ${m.awayTeam.shortName ?? m.awayTeam.name}`,
        detail: `Full time · ${matchDayLabel(m.utcDate)}`,
        match: m,
      });
    }

    for (const m of pool.filter(
      (m) =>
        (m.status === "SCHEDULED" || m.status === "TIMED") &&
        new Date(m.utcDate).getTime() - now < dayMs &&
        new Date(m.utcDate).getTime() > now,
    )) {
      list.push({
        id: `up-${m.id}`,
        icon: <CalendarClock className="h-4 w-4 text-vol" />,
        title: `${m.homeTeam.shortName ?? m.homeTeam.name} vs ${m.awayTeam.shortName ?? m.awayTeam.name}`,
        detail: `Kicks off ${matchDayLabel(m.utcDate)} · ${kickoffTime(m.utcDate)}`,
        match: m,
      });
    }

    return list.slice(0, 12);
  }, [data.seasonMatches, data.liveMatches, data.todayMatches]);

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-navy-950/50 backdrop-blur-[2px]"
          onClick={() => setNotificationsOpen(false)}
        >
          <motion.aside
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="menu absolute right-0 top-0 flex h-full w-[360px] flex-col rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-gold" />
                <span className="text-[13px] font-bold tracking-[0.14em] text-ink">
                  MATCH ALERTS
                </span>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                aria-label="Close notifications"
                className="text-ink-faint hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="scroll-slim flex-1 overflow-y-auto p-2">
              {!data.configured ? (
                <p className="px-4 py-8 text-center text-[12.5px] leading-relaxed text-ink-dim">
                  Connect a data provider to receive real match alerts. No
                  fictional notifications here.
                </p>
              ) : notices.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12.5px] leading-relaxed text-ink-dim">
                  Nothing in the last 24 hours. Alerts appear here for live
                  matches, final scores and upcoming kickoffs.
                </p>
              ) : (
                notices.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      selectMatch(n.match.id);
                      openMatchDetail(n.match.id);
                      setNotificationsOpen(false);
                    }}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                      {n.icon}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[12.5px] font-semibold text-ink">
                        {n.title}
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {n.detail}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-white/[0.08] px-4 py-3 text-[10.5px] leading-relaxed text-ink-faint">
              Alert preferences &amp; push delivery arrive with persistence in
              a later phase.
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
