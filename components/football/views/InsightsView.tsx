"use client";

import { useMemo } from "react";
import { PlugZap, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/lib/appState";
import type { Match } from "@/lib/types";
import { matchDayLabel, prettifyStage, statusLabel } from "@/lib/matchUtils";
import ViewShell from "./ViewShell";
import { CenteredState } from "../LiveMatchPanel";
import { ChartTooltip } from "../SentimentPanel";

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="well rounded-xl p-4">
      <div className="text-[10px] font-bold tracking-[0.16em] text-ink-faint">
        {label}
      </div>
      <div className="mt-1.5 text-[26px] font-black leading-none text-ink">
        {value}
      </div>
      {detail && (
        <div className="mt-1.5 truncate text-[11px] text-ink-dim">{detail}</div>
      )}
    </div>
  );
}

function MiniMatch({ match }: { match: Match }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 text-[12px] last:border-0">
      <span className="truncate text-ink">
        {match.homeTeam.shortName ?? match.homeTeam.name}
        <span className="mx-1.5 font-bold tabular-nums text-ink">
          {match.homeScore != null
            ? `${match.homeScore}–${match.awayScore ?? 0}`
            : "vs"}
        </span>
        {match.awayTeam.shortName ?? match.awayTeam.name}
      </span>
      <span className="ml-3 shrink-0 tabular-nums text-[11px] text-ink-faint">
        {matchDayLabel(match.utcDate)} · {statusLabel(match)}
      </span>
    </div>
  );
}

/**
 * Every number on this view is derived from real provider results —
 * no modelled or invented analytics.
 */
export default function InsightsView() {
  const { data } = useApp();
  const pool = data.seasonMatches;

  const insights = useMemo(() => {
    const finished = pool.filter(
      (m) => m.status === "FINISHED" && m.homeScore != null,
    );
    if (!finished.length) return null;

    const totalGoals = finished.reduce(
      (sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0),
      0,
    );

    let biggest: Match | null = null;
    let biggestMargin = -1;
    let highest: Match | null = null;
    let highestGoals = -1;
    for (const m of finished) {
      const margin = Math.abs((m.homeScore ?? 0) - (m.awayScore ?? 0));
      const goals = (m.homeScore ?? 0) + (m.awayScore ?? 0);
      if (margin > biggestMargin) {
        biggestMargin = margin;
        biggest = m;
      }
      if (goals > highestGoals) {
        highestGoals = goals;
        highest = m;
      }
    }

    const byStage = new Map<string, { goals: number; matches: number }>();
    for (const m of finished) {
      const key = m.stage ? prettifyStage(m.stage) : "Other";
      const entry = byStage.get(key) ?? { goals: 0, matches: 0 };
      entry.goals += (m.homeScore ?? 0) + (m.awayScore ?? 0);
      entry.matches++;
      byStage.set(key, entry);
    }

    return {
      finished,
      totalGoals,
      avgGoals: totalGoals / finished.length,
      biggest,
      highest,
      stageData: [...byStage.entries()].map(([stage, v]) => ({
        stage,
        goals: v.goals,
        perMatch: Number((v.goals / v.matches).toFixed(2)),
      })),
      recent: [...finished].slice(-5).reverse(),
      upcoming: pool
        .filter((m) => m.status === "SCHEDULED" || m.status === "TIMED")
        .slice(0, 5),
    };
  }, [pool]);

  const fmtMatch = (m: Match | null) =>
    m
      ? `${m.homeTeam.tla ?? m.homeTeam.name} ${m.homeScore}–${m.awayScore} ${m.awayTeam.tla ?? m.awayTeam.name}`
      : "—";

  return (
    <ViewShell
      title="INSIGHTS"
      subtitle="Derived from real tournament results only"
    >
      {!data.configured ? (
        <CenteredState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connect data provider"
          body="Insights are computed from real results — connect a provider to generate them."
        />
      ) : !insights ? (
        <CenteredState
          icon={<Sparkles className="h-5 w-5" />}
          title="Not enough data yet"
          body="Insights appear once the tournament has finished matches to analyse."
        />
      ) : (
        <div className="flex flex-col gap-5 p-6">
          {/* Headline tiles */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile
              label="MATCHES PLAYED"
              value={`${insights.finished.length}`}
              detail={`${insights.upcoming.length ? `${pool.length - insights.finished.length} remaining` : "Tournament schedule loaded"}`}
            />
            <StatTile
              label="TOTAL GOALS"
              value={`${insights.totalGoals}`}
              detail={`${insights.avgGoals.toFixed(2)} per match`}
            />
            <StatTile
              label="BIGGEST WIN"
              value={fmtMatch(insights.biggest)}
              detail={insights.biggest ? matchDayLabel(insights.biggest.utcDate) : undefined}
            />
            <StatTile
              label="HIGHEST SCORING"
              value={fmtMatch(insights.highest)}
              detail={insights.highest ? matchDayLabel(insights.highest.utcDate) : undefined}
            />
          </div>

          {/* Goals by stage — real aggregate */}
          <div className="well rounded-xl p-4">
            <div className="mb-3 text-[11px] font-bold tracking-[0.16em] text-ink-dim">
              GOALS PER MATCH BY STAGE
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insights.stageData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -24 }}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="stage"
                    tick={{ fill: "#9aa7bd", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar
                    dataKey="perMatch"
                    name="goals / match"
                    fill="#d8b45e"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent + upcoming */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="well rounded-xl p-4">
              <div className="mb-1 text-[11px] font-bold tracking-[0.16em] text-ink-dim">
                LATEST RESULTS
              </div>
              {insights.recent.map((m) => (
                <MiniMatch key={m.id} match={m} />
              ))}
            </div>
            <div className="well rounded-xl p-4">
              <div className="mb-1 text-[11px] font-bold tracking-[0.16em] text-ink-dim">
                NEXT FIXTURES
              </div>
              {insights.upcoming.length ? (
                insights.upcoming.map((m) => <MiniMatch key={m.id} match={m} />)
              ) : (
                <p className="py-3 text-[12px] text-ink-faint">
                  No upcoming fixtures in the provider schedule.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ViewShell>
  );
}
