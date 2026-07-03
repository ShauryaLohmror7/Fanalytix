"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/lib/appState";
import { generateMorePosts, generateSentimentSnapshot } from "@/lib/sentiment";
import type { SentimentSnapshot, SocialPost } from "@/lib/types";
import ViewShell, { SimulatedBadge } from "./ViewShell";
import {
  ChartTooltip,
  COLOR_NEG,
  COLOR_NEU,
  COLOR_POS,
  COLOR_VOL,
  SentimentGauge,
} from "../SentimentPanel";
import TrendingTopics from "../TrendingTopics";
import TopPosts from "../TopPosts";

/** Expanded simulated-sentiment workspace (badged; not real social data). */
export default function SentimentView() {
  const { featuredMatch: match } = useApp();
  const [snapshot, setSnapshot] = useState<SentimentSnapshot | null>(null);
  const [extraPosts, setExtraPosts] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const make = () =>
      setSnapshot(
        generateSentimentSnapshot(
          match
            ? {
                homeTla: match.homeTeam.tla,
                awayTla: match.awayTeam.tla,
                homeName: match.homeTeam.shortName ?? match.homeTeam.name,
                awayName: match.awayTeam.shortName ?? match.awayTeam.name,
              }
            : undefined,
        ),
      );
    make();
    const t = setInterval(make, 60_000);
    return () => clearInterval(t);
  }, [match]);

  const chartData = useMemo(
    () =>
      (snapshot?.series ?? []).map((p) => ({
        label: p.minutesAgo === 0 ? "Now" : `-${p.minutesAgo}m`,
        positive: p.positive,
        negative: p.negative,
        neutral: p.neutral,
        volume: p.volume,
      })),
    [snapshot],
  );

  const allPosts = useMemo(
    () => [...(snapshot?.posts ?? []), ...extraPosts],
    [snapshot, extraPosts],
  );

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    setExtraPosts((prev) => [
      ...prev,
      ...generateMorePosts(next, {
        homeName: match?.homeTeam.shortName ?? match?.homeTeam.name,
        awayName: match?.awayTeam.shortName ?? match?.awayTeam.name,
      }),
    ]);
  };

  return (
    <ViewShell
      title="SOCIAL SENTIMENT"
      subtitle={
        match
          ? `Context: ${match.homeTeam.shortName ?? match.homeTeam.name} vs ${match.awayTeam.shortName ?? match.awayTeam.name}`
          : "Tournament-wide view"
      }
      badge={<SimulatedBadge />}
    >
      {!snapshot ? (
        <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 p-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* Left: gauge + charts */}
          <div className="flex flex-col gap-4">
            <div className="well flex items-center gap-5 rounded-xl p-5">
              <SentimentGauge
                positive={snapshot.positive}
                negative={snapshot.negative}
                neutral={snapshot.neutral}
              />
              <div className="flex flex-col gap-2.5 text-[12px]">
                {[
                  { label: "Positive", value: snapshot.positive, color: COLOR_POS },
                  { label: "Negative", value: snapshot.negative, color: COLOR_NEG },
                  { label: "Neutral", value: snapshot.neutral, color: COLOR_NEU },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: row.color }}
                    />
                    <span className="w-16 text-ink-dim">{row.label}</span>
                    <span className="font-bold tabular-nums text-ink">
                      {row.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="well rounded-xl p-4">
              <div className="mb-2 text-[11px] font-bold tracking-[0.16em] text-ink-dim">
                SENTIMENT · LAST 60 MIN
              </div>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: -28 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      ticks={["-60m", "-30m", "Now"]}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      tickCount={3}
                    />
                    <Tooltip
                      content={<ChartTooltip unit="%" />}
                      cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                    />
                    <Line type="monotone" dataKey="positive" stroke={COLOR_POS} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="negative" stroke={COLOR_NEG} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="neutral" stroke={COLOR_NEU} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeOpacity={0.6} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="well rounded-xl p-4">
              <div className="mb-2 text-[11px] font-bold tracking-[0.16em] text-ink-dim">
                POST VOLUME
              </div>
              <div className="h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap={2}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      ticks={["-60m", "-30m", "Now"]}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    />
                    <Bar dataKey="volume" fill={COLOR_VOL} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right: topics + posts */}
          <div className="panel flex min-h-[560px] flex-col rounded-xl pb-1">
            <TrendingTopics
              topics={snapshot.topics}
              selectedTag={selectedTag}
              onSelect={setSelectedTag}
            />
            <TopPosts
              posts={allPosts}
              filterTag={selectedTag}
              onLoadMore={loadMore}
            />
          </div>
        </div>
      )}
    </ViewShell>
  );
}
