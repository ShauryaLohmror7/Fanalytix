"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  ChevronDown,
  Hexagon,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp, type ViewId } from "@/lib/appState";
import { isInPlay } from "@/lib/matchUtils";

const NAV_ITEMS: Array<{ label: string; view: ViewId }> = [
  { label: "Overview", view: "overview" },
  { label: "Matches", view: "matches" },
  { label: "Teams", view: "teams" },
  { label: "Sentiment", view: "sentiment" },
];

/** Secondary destinations, tucked away to keep the chrome minimal. */
const MORE_ITEMS: Array<{ label: string; view: ViewId }> = [
  { label: "Insights", view: "insights" },
  { label: "Players", view: "players" },
  { label: "Alerts", view: "alerts" },
  { label: "Heatmap", view: "heatmap" },
  { label: "Compare", view: "compare" },
  { label: "Bookmarks", view: "bookmarks" },
  { label: "Reports", view: "reports" },
  { label: "Settings", view: "settings" },
];

/** Closes the given popover when clicking outside its container. */
function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

function TournamentSelector() {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="chip flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ornaments/trophy.png"
          alt=""
          className="h-7 w-7 object-contain drop-shadow-[0_1px_4px_rgba(216,180,94,0.4)]"
        />
        <span className="leading-tight">
          <span className="font-royal block text-[12px] font-semibold text-ink">
            World Cup 2026
          </span>
          <span className="block text-[9.5px] uppercase tracking-[0.18em] text-gold/85">
            {/* Stage derived from real match data; neutral when unknown */}
            {data.stageLabel ? `✦ ${data.stageLabel} ✦` : "FIFA World Cup"}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="menu absolute right-0 top-full z-50 mt-2 w-64 rounded-xl p-1.5"
          >
            <div className="flex items-center justify-between rounded-lg bg-gold/10 px-3 py-2.5">
              <div className="leading-tight">
                <div className="text-[12px] font-semibold text-ink">
                  FIFA World Cup 2026
                </div>
                <div className="text-[10.5px] text-ink-dim">
                  {data.stageLabel ?? "Season data unavailable"}
                </div>
              </div>
              <Check className="h-4 w-4 text-gold" />
            </div>
            <div className="cursor-not-allowed rounded-lg px-3 py-2.5 opacity-50">
              <div className="text-[12px] font-medium text-ink-dim">
                More tournaments
              </div>
              <div className="text-[10.5px] text-ink-faint">
                Multi-competition support arrives in a later phase
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileMenu() {
  const { setView, exitExperience } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="chip flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-3 transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gold/30 to-gold-deep/20 text-gold">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-[12px] font-semibold text-ink">
            Analyst
          </span>
          <span className="block text-[10px] text-ink-dim">Local session</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="menu absolute right-0 top-full z-50 mt-2 w-56 rounded-xl p-1.5"
          >
            <div className="px-3 py-2">
              <div className="text-[12px] font-semibold text-ink">Analyst</div>
              <div className="text-[10.5px] text-ink-faint">
                Accounts &amp; profiles arrive with persistence in a later
                phase
              </div>
            </div>
            <button
              onClick={() => {
                setView("settings");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-ink-dim transition-colors hover:bg-white/5 hover:text-ink"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
            <button
              onClick={() => exitExperience()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-ink-dim transition-colors hover:bg-white/5 hover:text-gold"
            >
              <span className="w-3.5 text-center text-[13px] leading-none">↩</span>
              Witness another event
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MoreMenu() {
  const { view, setView } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const activeInMore = MORE_ITEMS.some((i) => i.view === view);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`relative flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
          activeInMore ? "text-gold-bright" : "text-ink-dim hover:text-ink"
        }`}
      >
        More
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
        {activeInMore && (
          <motion.span
            layoutId="nav-underline"
            className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-gold shadow-[0_0_10px_rgba(216,180,94,0.7)]"
          />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="menu absolute left-0 top-full z-50 mt-2 w-44 rounded-2xl p-1.5"
          >
            {MORE_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setView(item.view);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  view === item.view
                    ? "bg-gold/10 text-gold"
                    : "text-ink-dim hover:bg-white/5 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TopNav() {
  const { view, setView, setPaletteOpen, notificationsOpen, setNotificationsOpen, data } =
    useApp();
  const hasLive = data.liveMatches.some((m) => isInPlay(m.status));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-40 flex h-16 items-center gap-6 border-b border-white/[0.09] bg-[rgba(10,18,48,0.55)] px-5 backdrop-blur-2xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.12)]"
    >
      {/* Brand */}
      <button
        onClick={() => setView("overview")}
        className="flex items-center gap-3"
        aria-label="FanalytiX home"
      >
        <div className="gold-glow flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-navy-850">
          <Hexagon className="h-4.5 w-4.5 text-gold" strokeWidth={2.2} />
        </div>
        <div className="text-left leading-tight">
          <div className="font-royal text-[16px] font-bold tracking-[0.14em] text-ink">
            Fanalyti<span className="text-gold-sheen">X</span>
          </div>
          <div className="text-[8.5px] font-medium uppercase tracking-[0.34em] text-gold/75">
            Football Intelligence
          </div>
        </div>
      </button>

      {/* Views */}
      <nav className="ml-4 hidden items-center gap-1 lg:flex">
        {NAV_ITEMS.map((item) => {
          const isActive = item.view === view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`relative rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive ? "text-gold-bright" : "text-ink-dim hover:text-ink"
              }`}
            >
              {item.label}
              {isActive && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-gold shadow-[0_0_10px_rgba(216,180,94,0.7)]"
                />
              )}
            </button>
          );
        })}
        <MoreMenu />
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <TournamentSelector />

        <button
          aria-label="Search (⌘K)"
          title="Search teams & matches (⌘K)"
          onClick={() => setPaletteOpen(true)}
          className="chip flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim transition-colors hover:text-gold"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          aria-label="Notifications"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className={`chip relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            notificationsOpen ? "text-gold" : "text-ink-dim hover:text-gold"
          }`}
        >
          <Bell className="h-4 w-4" />
          {/* Indicator only when something is actually live */}
          {hasLive && (
            <span className="live-dot absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-live" />
          )}
        </button>

        <ProfileMenu />
      </div>
    </motion.header>
  );
}
