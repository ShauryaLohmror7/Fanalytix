"use client";

import { motion } from "framer-motion";
import {
  Bookmark,
  FileBarChart2,
  Flame,
  Globe2,
  Moon,
  Radio,
  Scale,
  Settings,
  Sun,
} from "lucide-react";
import { useState } from "react";

const ITEMS = [
  { id: "global", label: "Global", icon: Globe2 },
  { id: "live", label: "Live", icon: Radio },
  { id: "heatmap", label: "Heatmap", icon: Flame },
  { id: "compare", label: "Compare", icon: Scale },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "reports", label: "Reports", icon: FileBarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [active, setActive] = useState("global");
  const [darkMode, setDarkMode] = useState(true);

  return (
    <motion.aside
      initial={{ x: -32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="relative z-20 flex w-[76px] shrink-0 flex-col items-center gap-1 border-r border-white/5 bg-black/30 py-4 backdrop-blur-xl"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => setActive(id)}
            className="group relative flex w-full flex-col items-center gap-1 py-3"
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-neon-green shadow-[0_0_12px_rgba(74,222,128,0.9)]"
              />
            )}
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                isActive
                  ? "bg-neon-green/10 text-neon-green ring-glow-green"
                  : "text-slate-500 group-hover:bg-white/5 group-hover:text-slate-200"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span
              className={`text-[9.5px] font-medium tracking-wide ${
                isActive ? "text-neon-green" : "text-slate-500 group-hover:text-slate-300"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}

      {/* Dark mode toggle pinned to the bottom */}
      <button
        onClick={() => setDarkMode((d) => !d)}
        className="group mt-auto flex flex-col items-center gap-1.5 pb-1"
        aria-label="Toggle dark mode"
      >
        <span className="relative flex h-6 w-11 items-center rounded-full border border-white/10 bg-white/5 px-0.5">
          <motion.span
            animate={{ x: darkMode ? 0 : 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-neon-green/20 text-neon-green"
          >
            {darkMode ? (
              <Moon className="h-3 w-3" />
            ) : (
              <Sun className="h-3 w-3" />
            )}
          </motion.span>
        </span>
        <span className="text-[9px] text-slate-500 group-hover:text-slate-300">
          {darkMode ? "Dark Mode" : "Light Mode"}
        </span>
      </button>
    </motion.aside>
  );
}
