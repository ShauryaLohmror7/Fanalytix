"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Goal } from "lucide-react";
import type { Match, MatchEvent } from "@/lib/types";
import { teamCode } from "@/lib/matchUtils";

function eventVisual(type: MatchEvent["type"]) {
  switch (type) {
    case "GOAL":
    case "PENALTY_GOAL":
    case "OWN_GOAL":
      return {
        label:
          type === "OWN_GOAL"
            ? "OWN GOAL"
            : type === "PENALTY_GOAL"
              ? "GOAL (P)"
              : "GOAL!",
        icon: <Goal className="h-3 w-3" />,
        chip: "bg-neon-green/15 text-neon-green border-neon-green/30",
      };
    case "YELLOW_CARD":
      return {
        label: "YELLOW CARD",
        icon: <span className="block h-3 w-2 rounded-[2px] bg-neon-yellow" />,
        chip: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30",
      };
    case "RED_CARD":
      return {
        label: "RED CARD",
        icon: <span className="block h-3 w-2 rounded-[2px] bg-neon-red-bright" />,
        chip: "bg-neon-red/15 text-neon-red-bright border-neon-red/40",
      };
    case "SUBSTITUTION":
      return {
        label: "SUBSTITUTION",
        icon: <ArrowLeftRight className="h-3 w-3" />,
        chip: "bg-neon-blue/10 text-sky-300 border-neon-blue/30",
      };
  }
}

export default function MatchEventRow({
  event,
  match,
  index,
}: {
  event: MatchEvent;
  match: Match;
  index: number;
}) {
  const visual = eventVisual(event.type);
  const team = event.team === "HOME" ? match.homeTeam : match.awayTeam;

  const detail =
    event.type === "SUBSTITUTION"
      ? [event.player, event.playerSecondary].filter(Boolean).join(" ⇄ ")
      : (event.player ?? "");

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-center gap-3 border-b border-white/[0.04] py-2 last:border-0"
    >
      <span className="w-9 text-[12px] font-bold tabular-nums text-slate-300">
        {event.minute}
      </span>
      <span
        className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${visual.chip}`}
      >
        {visual.icon}
        {visual.label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-slate-300">
        <span className="text-slate-500">{teamCode(team)}</span>
        {detail && <span className="ml-1.5 text-slate-200">{detail}</span>}
      </span>
    </motion.li>
  );
}
