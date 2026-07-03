"use client";

import { Bookmark } from "lucide-react";
import { useApp } from "@/lib/appState";
import { matchDayLabel, stageLabel, statusLabel } from "@/lib/matchUtils";
import ViewShell, { PhaseNote } from "./ViewShell";
import { CenteredState } from "../LiveMatchPanel";

/** Session-only bookmarks (persistence lands in the next phase). */
export default function BookmarksView() {
  const { data, bookmarkIds, toggleBookmark, selectMatch, openMatchDetail } =
    useApp();

  const pool = [
    ...data.liveMatches,
    ...data.todayMatches,
    ...data.seasonMatches,
  ];
  const bookmarks = bookmarkIds
    .map((id) => pool.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <ViewShell title="BOOKMARKS" subtitle="Matches you’ve pinned this session">
      {bookmarks.length === 0 ? (
        <CenteredState
          icon={<Bookmark className="h-5 w-5" />}
          title="No bookmarks yet"
          body="Use the bookmark button on any match panel, detail view or ticker card to pin matches here."
        />
      ) : (
        <div className="p-4">
          {bookmarks.map((m) => (
            <div
              key={m.id}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <button
                onClick={() => {
                  selectMatch(m.id);
                  openMatchDetail(m.id);
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {m.homeTeam.shortName ?? m.homeTeam.name}
                    <span className="mx-1.5 font-bold tabular-nums">
                      {m.homeScore != null
                        ? `${m.homeScore}–${m.awayScore ?? 0}`
                        : "vs"}
                    </span>
                    {m.awayTeam.shortName ?? m.awayTeam.name}
                  </span>
                  <span className="text-[11px] text-ink-faint">
                    {stageLabel(m)} · {matchDayLabel(m.utcDate)} ·{" "}
                    {statusLabel(m)}
                  </span>
                </span>
              </button>
              <button
                aria-label="Remove bookmark"
                onClick={() => toggleBookmark(m.id)}
                className="text-gold hover:text-gold-bright"
              >
                <Bookmark className="h-4 w-4" fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
      <PhaseNote text="Bookmarks are session-only for now — database persistence ships in the next phase, so pins will survive reloads." />
    </ViewShell>
  );
}
