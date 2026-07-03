"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, SlidersHorizontal, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { generateMorePosts, generateSentimentSnapshot } from "@/lib/sentiment";
import type { Match, SentimentSnapshot, SocialPost } from "@/lib/types";
import TrendingTopics from "./TrendingTopics";
import TopPosts from "./TopPosts";

/* Palette validated with the dataviz six-checks script on the twilight
   pitch surface #1a3a2d: pos/neg pass CVD separation (ΔE 16.5 deutan)
   and 3:1 contrast; identity is additionally carried by direct labels. */
export const COLOR_POS = "#4ade80";
export const COLOR_NEG = "#f43f5e";
export const COLOR_NEU = "#e2e8f0";
export const COLOR_VOL = "#d8b45e";

/* --------------------------- gauge ring --------------------------- */

export function SentimentGauge({
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
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* Engraved gold bezel with tick marks */}
        <circle
          cx="50"
          cy="50"
          r={49}
          fill="none"
          stroke="rgba(216,180,94,0.55)"
          strokeWidth="1"
        />
        <circle
          cx="50"
          cy="50"
          r={35.5}
          fill="none"
          stroke="rgba(216,180,94,0.35)"
          strokeWidth="0.75"
        />
        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * 47}
              y1={50 + Math.sin(a) * 47}
              x2={50 + Math.cos(a) * 49}
              y2={50 + Math.sin(a) * 49}
              stroke="rgba(216,180,94,0.5)"
              strokeWidth="0.8"
            />
          );
        })}
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
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-black leading-none text-ink">
          {positive}
          <span className="text-[15px] font-bold text-ink-faint">%</span>
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-pos">
          Positive
        </span>
      </div>
    </div>
  );
}

/* -------------------------- chart tooltip -------------------------- */

export function ChartTooltip({
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
    <div className="menu rounded-lg px-2.5 py-1.5 text-[11px]">
      <div className="mb-0.5 font-semibold text-ink-dim">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 text-ink">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color ?? p.stroke ?? p.fill }}
          />
          <span className="capitalize text-ink-faint">{p.name}</span>
          <span className="ml-auto pl-3 font-bold tabular-nums">
            {p.value.toLocaleString()}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------- display options ------------------------- */

interface DisplayOptions {
  showNeutral: boolean;
  windowMinutes: 30 | 60;
}

function OptionsPopover({
  options,
  onChange,
  onClose,
}: {
  options: DisplayOptions;
  onChange: (next: DisplayOptions) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="menu absolute right-0 top-full z-50 mt-2 w-52 rounded-xl p-2"
    >
      <div className="px-2 pb-1.5 pt-0.5 text-[10px] font-bold tracking-[0.14em] text-ink-faint">
        DISPLAY OPTIONS
      </div>
      <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-[12px] text-ink-dim hover:bg-white/5">
        Show neutral series
        <input
          type="checkbox"
          checked={options.showNeutral}
          onChange={(e) =>
            onChange({ ...options, showNeutral: e.target.checked })
          }
          className="h-3.5 w-3.5 accent-[#d8b45e]"
        />
      </label>
      <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] text-ink-dim">
        Window
        <div className="flex gap-1">
          {([30, 60] as const).map((w) => (
            <button
              key={w}
              onClick={() => onChange({ ...options, windowMinutes: w })}
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                options.windowMinutes === w
                  ? "bg-gold/15 text-gold"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              {w}m
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------ panel ------------------------------ */

export default function SentimentPanel({ match }: { match: Match | null }) {
  const [snapshot, setSnapshot] = useState<SentimentSnapshot | null>(null);
  const [extraPosts, setExtraPosts] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [options, setOptions] = useState<DisplayOptions>({
    showNeutral: true,
    windowMinutes: 60,
  });

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
      (snapshot?.series ?? [])
        .filter((p) => p.minutesAgo <= options.windowMinutes)
        .map((p) => ({
          label: p.minutesAgo === 0 ? "Now" : `-${p.minutesAgo}m`,
          positive: p.positive,
          negative: p.negative,
          neutral: p.neutral,
          volume: p.volume,
        })),
    [snapshot, options.windowMinutes],
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
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
      className="panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
        <span className="font-royal text-[12px] font-bold tracking-[0.18em] text-gold-sheen">
          SOCIAL SENTIMENT
        </span>
        <div className="relative flex items-center gap-2">
          {/* Honest source badge — flips to LIVE when a social API is wired */}
          <span
            className="flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-warn"
            title="Sentiment is generated by an internal placeholder engine until a social data API is connected."
          >
            <FlaskConical className="h-3 w-3" />
            SIMULATED
          </span>
          <button
            aria-label="Display options"
            aria-expanded={optionsOpen}
            onClick={() => setOptionsOpen((o) => !o)}
            className={`transition-colors ${optionsOpen ? "text-gold" : "text-ink-faint hover:text-ink-dim"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {optionsOpen && (
              <OptionsPopover
                options={options}
                onChange={setOptions}
                onClose={() => setOptionsOpen(false)}
              />
            )}
          </AnimatePresence>
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
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NEG }} />
                    {snapshot.negative}%
                  </div>
                  <div className="pl-3.5 text-ink-faint">Negative</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLOR_NEU }} />
                    {snapshot.neutral}%
                  </div>
                  <div className="pl-3.5 text-ink-faint">Neutral</div>
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
                    ticks={[`-${options.windowMinutes}m`, `-${options.windowMinutes / 2}m`, "Now"]}
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
                  {options.showNeutral && (
                    <Line type="monotone" dataKey="neutral" stroke={COLOR_NEU} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeOpacity={0.6} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend + volume tiles */}
          <div className="grid grid-cols-2 gap-2.5 px-4 pt-4">
            <div className="well rounded-xl p-3">
              <div className="text-[10px] font-bold tracking-[0.14em] text-ink-dim">
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
                <TrendingUp className="h-3.5 w-3.5 text-pos" />
                <span className="font-bold text-pos">
                  {snapshot.trendDeltaPct >= 0 ? "+" : ""}
                  {snapshot.trendDeltaPct}%
                </span>
                <span className="text-ink-faint">vs 60m ago</span>
              </div>
            </div>

            <div className="well rounded-xl p-3">
              <div className="text-[10px] font-bold tracking-[0.14em] text-ink-dim">
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
                <TrendingUp className="h-3.5 w-3.5 text-gold" />
                <span className="font-bold text-gold">
                  {snapshot.volumeDeltaPct >= 0 ? "+" : ""}
                  {snapshot.volumeDeltaPct}%
                </span>
                <span className="text-ink-faint">vs 60m ago</span>
              </div>
            </div>
          </div>

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
      )}
    </motion.section>
  );
}
