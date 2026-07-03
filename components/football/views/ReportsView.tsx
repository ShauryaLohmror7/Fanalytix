"use client";

import { Download, FileJson, FileSpreadsheet, PlugZap } from "lucide-react";
import { useApp } from "@/lib/appState";
import type { Match } from "@/lib/types";
import { prettifyStage } from "@/lib/matchUtils";
import ViewShell, { PhaseNote } from "./ViewShell";
import { CenteredState } from "../LiveMatchPanel";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function matchesToCsv(matches: Match[]): string {
  const header =
    "date,stage,group,home_team,away_team,home_score,away_score,status,venue,referee";
  const esc = (v: string | number | undefined) =>
    v == null ? "" : `"${String(v).replaceAll('"', '""')}"`;
  const rows = matches.map((m) =>
    [
      m.utcDate,
      m.stage ? prettifyStage(m.stage) : "",
      m.group ?? "",
      m.homeTeam.name,
      m.awayTeam.name,
      m.homeScore ?? "",
      m.awayScore ?? "",
      m.status,
      m.venue ?? "",
      m.referee ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

/** Client-side exports of the real loaded dataset — no invented fields. */
export default function ReportsView() {
  const { data } = useApp();
  const pool = data.seasonMatches.length ? data.seasonMatches : data.todayMatches;
  const stamp = new Date().toISOString().slice(0, 10);

  const exports = [
    {
      icon: <FileSpreadsheet className="h-4 w-4" />,
      title: "Tournament schedule & results (CSV)",
      detail: `${pool.length} matches with scores, venues and referees`,
      disabled: pool.length === 0,
      run: () =>
        download(
          `fanalytix-matches-${stamp}.csv`,
          matchesToCsv(pool),
          "text/csv",
        ),
    },
    {
      icon: <FileJson className="h-4 w-4" />,
      title: "Tournament schedule & results (JSON)",
      detail: "Full normalized match objects",
      disabled: pool.length === 0,
      run: () =>
        download(
          `fanalytix-matches-${stamp}.json`,
          JSON.stringify(pool, null, 2),
          "application/json",
        ),
    },
    {
      icon: <FileJson className="h-4 w-4" />,
      title: "Group standings (JSON)",
      detail: `${data.standings.length} groups`,
      disabled: data.standings.length === 0,
      run: () =>
        download(
          `fanalytix-standings-${stamp}.json`,
          JSON.stringify(data.standings, null, 2),
          "application/json",
        ),
    },
  ];

  return (
    <ViewShell title="REPORTS" subtitle="Export the loaded real dataset">
      {!data.configured ? (
        <CenteredState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connect data provider"
          body="Reports export real provider data — connect a provider to enable them."
        />
      ) : (
        <div className="mx-auto w-full max-w-xl p-6">
          <div className="well rounded-xl">
            {exports.map((e, i) => (
              <button
                key={e.title}
                onClick={e.run}
                disabled={e.disabled}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-40 ${
                  i > 0 ? "border-t border-white/[0.05]" : ""
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  {e.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">
                    {e.title}
                  </span>
                  <span className="text-[11.5px] text-ink-faint">
                    {e.detail}
                  </span>
                </span>
                <Download className="h-4 w-4 shrink-0 text-ink-faint" />
              </button>
            ))}
          </div>
        </div>
      )}
      <PhaseNote text="Scheduled and shareable reports (PDF, email digests) arrive with backend persistence in a later phase. Simulated sentiment is intentionally excluded from exports." />
    </ViewShell>
  );
}
