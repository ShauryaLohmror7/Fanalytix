"use client";

import { motion } from "framer-motion";
import type { MatchStatistic } from "@/lib/types";

/**
 * One stat comparison row: home value | centered bar+label | away value.
 * The bar splits proportionally, home side glowing green, away side red.
 */
export default function StatRow({ stat }: { stat: MatchStatistic }) {
  const total = stat.home + stat.away;
  const homeShare = total > 0 ? stat.home / total : 0.5;
  const fmt = (v: number) => (stat.isPercentage ? `${v}%` : `${v}`);

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="w-12 font-semibold tabular-nums text-gold">
          {fmt(stat.home)}
        </span>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          {stat.label}
        </span>
        <span className="w-12 text-right font-semibold tabular-nums text-ink">
          {fmt(stat.away)}
        </span>
      </div>
      <div className="mt-1 flex h-[3px] w-full gap-[2px] overflow-hidden rounded-full bg-white/5">
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ width: `${homeShare * 100}%`, transformOrigin: "left" }}
          className="rounded-full bg-gold/80"
        />
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ width: `${(1 - homeShare) * 100}%`, transformOrigin: "right" }}
          className="rounded-full bg-ink-faint/60"
        />
      </div>
    </div>
  );
}
