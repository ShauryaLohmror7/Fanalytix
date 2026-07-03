"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import TopNav from "@/components/football/TopNav";
import LiveMatchPanel from "@/components/football/LiveMatchPanel";
import SentimentPanel from "@/components/football/SentimentPanel";
import MatchTicker from "@/components/football/MatchTicker";
import CommandPalette from "@/components/football/CommandPalette";
import NotificationsDrawer from "@/components/football/NotificationsDrawer";
import MatchDetail from "@/components/football/MatchDetail";
import PromptDock from "@/components/football/PromptDock";
import { GoldStatue } from "@/components/football/Ornaments";
import MatchesView from "@/components/football/views/MatchesView";
import TeamsView from "@/components/football/views/TeamsView";
import PlayersView from "@/components/football/views/PlayersView";
import SentimentView from "@/components/football/views/SentimentView";
import InsightsView from "@/components/football/views/InsightsView";
import AlertsView from "@/components/football/views/AlertsView";
import HeatmapView from "@/components/football/views/HeatmapView";
import CompareView from "@/components/football/views/CompareView";
import BookmarksView from "@/components/football/views/BookmarksView";
import ReportsView from "@/components/football/views/ReportsView";
import SettingsView from "@/components/football/views/SettingsView";
import { AppProvider, useApp } from "@/lib/appState";

// Three.js can only run in the browser — skip SSR for the globe.
const FootballGlobe = dynamic(
  () => import("@/components/football/FootballGlobe"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-40 w-40 animate-pulse rounded-full border border-gold/25 bg-gold/5" />
      </div>
    ),
  },
);

/**
 * Home — quiet by default: just the world and the ask-bar. The match and
 * sentiment panels glide in only once something is in focus.
 */
function Home() {
  const { featuredMatch, analysisOpen, setAnalysisOpen } = useApp();

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <GoldStatue side="left" />
      <GoldStatue side="right" />
      <FootballGlobe />
      <PromptDock />

      <AnimatePresence>
        {analysisOpen && (
          <>
            <motion.div
              key="match-panel"
              initial={{ x: -420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -420, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute bottom-40 left-4 top-3 z-20 w-[min(340px,86vw)]"
            >
              <LiveMatchPanel />
            </motion.div>

            <motion.div
              key="sentiment-panel"
              initial={{ x: 440, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 440, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30, delay: 0.06 }}
              className="absolute bottom-40 right-4 top-3 z-20 w-[min(360px,86vw)]"
            >
              <SentimentPanel match={featuredMatch} />
            </motion.div>

            <motion.button
              key="close-analysis"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.15 }}
              onClick={() => setAnalysisOpen(false)}
              aria-label="Close analysis panels"
              className="liquid-btn absolute bottom-[10.5rem] left-1/2 z-30 flex h-9 -translate-x-1/2 items-center gap-2 rounded-full px-4 text-[12px] font-semibold text-ink-dim hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
              Close analysis
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MainView() {
  const { view } = useApp();
  switch (view) {
    case "matches":
      return <MatchesView />;
    case "teams":
      return <TeamsView />;
    case "players":
      return <PlayersView />;
    case "sentiment":
      return <SentimentView />;
    case "insights":
      return <InsightsView />;
    case "alerts":
      return <AlertsView />;
    case "heatmap":
      return <HeatmapView />;
    case "compare":
      return <CompareView />;
    case "bookmarks":
      return <BookmarksView />;
    case "reports":
      return <ReportsView />;
    case "settings":
      return <SettingsView />;
    default:
      return <Home />;
  }
}

function Shell() {
  const { view } = useApp();
  const isHome = view === "overview";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Royal stadium backdrop (user artwork) under everything */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/backdrop.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(9,16,41,0.25)] via-transparent to-[rgba(7,12,32,0.55)]" />
      </div>

      <TopNav />
      <main className={`relative z-10 min-h-0 flex-1 ${isHome ? "" : "p-4"}`}>
        <MainView />
      </main>
      <MatchTicker />

      {/* Global overlays */}
      <CommandPalette />
      <NotificationsDrawer />
      <MatchDetail />
    </div>
  );
}

/**
 * The Football arena — a self-contained experience module. `initialQuery`
 * carries whatever the visitor typed on the landing portal; `onExit`
 * returns them to it.
 */
export default function FootballExperience({
  initialQuery,
  onExit,
}: {
  initialQuery?: string | null;
  onExit?: () => void;
}) {
  return (
    <div data-theme="royal-gold" className="contents">
      <AppProvider initialQuery={initialQuery} onExit={onExit}>
        <Shell />
      </AppProvider>
    </div>
  );
}
