"use client";

import dynamic from "next/dynamic";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import LiveMatchPanel from "@/components/LiveMatchPanel";
import SentimentPanel from "@/components/SentimentPanel";
import MatchTicker from "@/components/MatchTicker";
import { useWorldCupData } from "@/lib/useWorldCupData";

// Three.js can only run in the browser — skip SSR for the globe.
const FootballGlobe = dynamic(() => import("@/components/FootballGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-40 w-40 animate-pulse rounded-full border border-neon-green/20 bg-neon-green/5" />
    </div>
  ),
});

export default function OverviewPage() {
  const {
    configured,
    loading,
    error,
    liveMatches,
    featuredMatch,
    tickerMatches,
  } = useWorldCupData();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-pitch-950">
      {/* Ambient page glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 40%, rgba(16,64,40,0.28), transparent 70%)," +
            "radial-gradient(ellipse 30% 30% at 0% 100%, rgba(14,60,38,0.18), transparent 70%)," +
            "radial-gradient(ellipse 30% 30% at 100% 100%, rgba(80,15,35,0.12), transparent 70%)",
        }}
      />

      <TopNav />

      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar />

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[340px_minmax(0,1fr)_380px] xl:grid-cols-[360px_minmax(0,1fr)_400px]">
          {/* Left: live match */}
          <div className="order-2 min-h-0 lg:order-1">
            <LiveMatchPanel
              match={featuredMatch}
              configured={configured}
              loading={loading}
              error={error}
            />
          </div>

          {/* Center: 3D football globe */}
          <div className="order-1 min-h-[420px] lg:order-2 lg:min-h-0">
            <FootballGlobe />
          </div>

          {/* Right: social sentiment */}
          <div className="order-3 min-h-0">
            <SentimentPanel match={featuredMatch} />
          </div>
        </main>
      </div>

      <MatchTicker
        matches={tickerMatches}
        liveCount={liveMatches.length}
        configured={configured}
        loading={loading}
      />
    </div>
  );
}
