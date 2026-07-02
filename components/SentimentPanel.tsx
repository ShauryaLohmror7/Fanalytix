"use client";

import { motion } from "framer-motion";
import { FlaskConical, SlidersHorizontal, TrendingUp } from "lucide-react";
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
import { generateSentimentSnapshot } from "@/lib/sentiment";
import type { Match, SentimentSnapshot } from "@/lib/types";
import TrendingTopics from "./TrendingTopics";
import TopPosts from "./TopPosts";

/* Palette validated with the dataviz six-checks script (dark surface):
   green #4ade80 / red #e11d48 pass CVD separation (ΔE 23.7 deutan) and
   3:1 contrast; identity is additionally carried by direct labels. */
const COLOR_POS = "#4ade80";
const COLOR_NEG = "#e11d48";
const COLOR_NEU = "#cbd5e1";
const COLOR_VOL = "#0ea5e9";

/* --------------------------- gauge ring --------------------------- */

function SentimentGauge({
  positive,
  negative,
  neutral,
}: {
  positive: number;
  negative: number;
  neutral: number;
}) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const gap = 4; // px gap between ring segments
  const seg = (pct: number) => Math.max((pct / 100) * C - gap, 0);

  let offset = C * 0.25; // start at 12 o'clock
  const segments = [
    { value: positive, color: COLOR_POS },
    { value: negative, color: COLOR_NEG },
    { value: neutral, color: COLOR_NEU },
  ].map((s) => {
    const d = { ...s, dash: seg(s.value), offset };
    offset -= (s.value / 100) * C;
    return d;
  });

  return (
    <div className="relative h-[116px] w-[116px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-0">
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="7"
        />
        {segments.map((s, i) => (
          <motion.circle
            key={i}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={s.offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
            style={
              i === 0
                ? { filter: "drop-shadow(0 0 6px rgba(74,222,128,0.6))" }
                : undefined
            }
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-black leading-none text-white">
          {positive}
          <span className="text-[15px] font-bold text-slate-400">%</span>
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-neon-green">
          Positive
        </span>
      </div>
    </div>
  );
}

/* -------------------------- chart tooltip -------------------------- */

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; stroke?: string; fill?: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/85 px-2.5 py-1.5 text-[11px] shadow-xl backdrop-blur">
      <div className="mb-0.5 font-semibold text-slate-300">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 text-slate-200">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color ?? p.stroke ?? p.fill }}
          />
          <span className="capitalize text-slate-400">{p.name}</span>
          <span className="ml-auto pl-3 font-bold tabular-nums">
            {p.value.toLocaleString()}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ panel ------------------------------ */

export default function SentimentPanel({ match }: { match: Match | null }) {
  const [snapshot, setSnapshot] = useState<SentimentSnapshot | null>(null);

  // Client-side generation keeps SSR/CSR markup consistent and re-rolls
  // every 60s so the simulated stream feels alive.
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

  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
      className="glass-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-neon-green live-dot" />
          <span className="text-[12px] font-bold tracking-[0.18em] text-white">
            SOCIAL SENTIMENT
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Honest source badge — flips to LIVE when a social API is wired */}
          <span
            className="flex items-center gap-1 rounded-full border border-neon-yellow/25 bg-neon-yellow/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-neon-yellow"
            title="Sentiment is generated by an internal placeholder engine until a social data API is connected."
          >
            <FlaskConical className="h-3 w-3" />
            SIMULATED
          </span>
          <button
            aria-label="Sentiment settings"
            className="text-slate-500 hover:text-slate-300"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!snapshot ? (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="h-28 animate-pulse rounded-xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Gauge + trend chart */}
          <div className="flex items-center gap-3 px-4 pt-4">
            <div className="flex items-center gap-3">
              <SentimentGauge
                positive={snapshot.positive}
                negative={snapshot.negative}
                neutral={snapshot.neutral}
              />
              {/* Direct labels double as the legend for the ring + lines */}
              <div className="flex flex-col gap-2 text-[11px]">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NEG }} />
                    {snapshot.negative}%
                  </div>
                  <div className="pl-3.5 text-slate-400">Negative</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NEU }} />
                    {snapshot.neutral}%
                  </div>
                  <div className="pl-3.5 text-slate-400">Neutral</div>
                </div>
              </div>
            </div>

            <div className="h-[110px] min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 14, bottom: 0, left: -32 }}>
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
                  <Line type="monotone" dataKey="neutral" stroke={COLOR_NEU} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeOpacity={0.65} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend + volume tiles */}
          <div className="grid grid-cols-2 gap-2.5 px-4 pt-4">
            <div className="glass-chip rounded-xl p-3">
              <div className="text-[10px] font-bold tracking-[0.14em] text-slate-300">
                SENTIMENT TREND
              </div>
              <div className="mt-1 h-[42px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                    <Tooltip content={<ChartTooltip unit="%" />} cursor={false} />
                    <Line
                      type="monotone"
                      dataKey="positive"
                      stroke={COLOR_POS}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                <TrendingUp className="h-3.5 w-3.5 text-neon-green" />
                <span className="font-bold text-neon-green">
                  {snapshot.trendDeltaPct >= 0 ? "+" : ""}
                  {snapshot.trendDeltaPct}%
                </span>
                <span className="text-slate-500">vs 60m ago</span>
              </div>
            </div>

            <div className="glass-chip rounded-xl p-3">
              <div className="text-[10px] font-bold tracking-[0.14em] text-slate-300">
                VOLUME
              </div>
              <div className="mt-1 h-[42px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 2, bottom: 2, left: 2 }} barCategoryGap={2}>
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar dataKey="volume" fill={COLOR_VOL} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-bold text-sky-400">
                  {snapshot.volumeDeltaPct >= 0 ? "+" : ""}
                  {snapshot.volumeDeltaPct}%
                </span>
                <span className="text-slate-500">vs 60m ago</span>
              </div>
            </div>
          </div>

          <TrendingTopics topics={snapshot.topics} />
          <TopPosts posts={snapshot.posts} />
        </div>
      )}
    </motion.section>
  );
}
