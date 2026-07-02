"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Hexagon,
  Search,
  Trophy,
  UserRound,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  "Overview",
  "Matches",
  "Sentiment",
  "Teams",
  "Players",
  "Insights",
  "Alerts",
];

export default function TopNav() {
  const [active, setActive] = useState("Overview");

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-30 flex h-16 items-center gap-6 border-b border-white/5 bg-black/40 px-5 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-neon-green/30 bg-pitch-800 ring-glow-green">
          <Hexagon className="h-4.5 w-4.5 text-neon-green" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-[0.18em] text-white">
            FANALYTIX
          </div>
          <div className="text-[9px] font-medium uppercase tracking-[0.32em] text-neon-green/70">
            Football Intelligence
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="ml-4 hidden items-center gap-1 lg:flex">
        {NAV_ITEMS.map((item) => {
          const isActive = item === active;
          return (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`relative rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive
                  ? "text-neon-green"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item}
              {isActive && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-neon-green shadow-[0_0_10px_rgba(74,222,128,0.8)]"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* Tournament selector */}
        <button className="glass-chip flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:border-neon-green/30">
          <Trophy className="h-4 w-4 text-neon-yellow" />
          <span className="leading-tight">
            <span className="block text-[12px] font-semibold text-white">
              World Cup 2026
            </span>
            <span className="block text-[10px] text-slate-400">
              Group Stage
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        <button
          aria-label="Search"
          className="glass-chip flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-neon-green"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          aria-label="Notifications"
          className="glass-chip relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-neon-green"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neon-green live-dot" />
        </button>

        {/* Profile */}
        <button className="glass-chip flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-3 transition-colors hover:border-neon-green/30">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-neon-green/30 to-neon-blue/20 text-neon-green">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[12px] font-semibold text-white">
              Analyst
            </span>
            <span className="block text-[10px] text-slate-400">
              FanalytiX Pro
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </motion.header>
  );
}
