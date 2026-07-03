"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Hexagon, Lock, PlugZap } from "lucide-react";
import { getArenaConfig } from "@/lib/events/registry";
import type { EventDomain, EventResolution } from "@/lib/events/types";

/**
 * The coming-soon arena — shown for any event we can't serve with real
 * data yet. Domain-aware but relentlessly honest: no fake charts, numbers,
 * news or sentiment. It names the visitor's moment, says which arena
 * recognised it, and previews (disabled) what that arena will do.
 */

/** Per-domain voice for the honest shell. */
const DOMAIN_VOICE: Record<EventDomain, { kicker: string; line: string }> = {
  football: {
    kicker: "Football Arena",
    line: "The royal stand is open — this query just needs the main gate.",
  },
  space: {
    kicker: "Space Arena",
    line: "Mission telemetry, countdowns and trajectories will stream here.",
  },
  markets: {
    kicker: "Markets Arena",
    line: "Listings, tape and the movement of capital will settle here.",
  },
  geopolitics: {
    kicker: "Geopolitics Arena",
    line: "The situation room is being furnished — maps, corridors, records.",
  },
  elections: {
    kicker: "Elections Arena",
    line: "The civic signal — tallies, districts, turnout — will be counted here.",
  },
  generic: {
    kicker: "The Observatory",
    line: "Every moment worth watching earns an arena. This one is being charted.",
  },
};

export default function GenericArena({
  resolution,
  onExit,
}: {
  resolution: EventResolution;
  onExit: () => void;
}) {
  const config = getArenaConfig(resolution.domain);
  const voice = DOMAIN_VOICE[resolution.domain];

  return (
    <motion.div
      data-theme={config.theme.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative flex h-screen w-screen flex-col overflow-hidden"
    >
      {/* Sapphire depths */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% 30%, #101c42 0%, #0a1330 48%, #060a1a 100%)",
        }}
        aria-hidden
      />

      {/* Chrome: wordmark + return */}
      <header className="relative z-10 flex items-center justify-between px-8 pt-7">
        <div className="flex items-center gap-3">
          <div className="gold-glow flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-[#0d1531]">
            <Hexagon className="h-4 w-4 text-gold" strokeWidth={2.2} />
          </div>
          <div className="font-royal text-[14px] font-bold tracking-[0.16em] text-ink">
            Fanalyti<span className="text-gold-sheen">X</span>
          </div>
        </div>
        <button
          onClick={onExit}
          className="liquid-btn flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-ink-dim hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Witness another event
        </button>
      </header>

      {/* The held moment */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-12 text-center">
        {/* Central empty-state visual: a quiet gold observatory ring */}
        <div className="relative mb-9 h-40 w-40">
          <motion.span
            className="absolute inset-0 rounded-full border border-gold/30"
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 0.35, 0.7] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute inset-4 rounded-full border border-gold/20"
            animate={{ scale: [1.04, 1, 1.04], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          <span className="absolute inset-[38%] rounded-full bg-gradient-to-br from-gold-bright via-gold to-gold-deep shadow-[0_0_50px_rgba(216,180,94,0.35)]" />
        </div>

        <p className="text-[10.5px] font-medium uppercase tracking-[0.4em] text-gold/80">
          {voice.kicker}
        </p>
        <h1 className="font-royal mt-3 max-w-2xl text-[clamp(22px,3.2vw,36px)] font-semibold leading-tight tracking-[0.03em] text-ink">
          “{resolution.query}”
        </h1>
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-ink-dim">
          {voice.line}
        </p>

        <div className="mt-7 flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-4 py-2 text-[12.5px] text-ink-dim">
          <PlugZap className="h-4 w-4 text-gold" />
          Provider not connected yet — this arena is being prepared.
        </div>

        {/* Disabled previews of what the arena will support — no fake data */}
        <div className="mt-9 grid w-[min(680px,92vw)] grid-cols-1 gap-3 sm:grid-cols-3">
          {config.comingNext.slice(0, 3).map((capability, i) => (
            <motion.div
              key={capability}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              aria-disabled
              className="glass-deep cursor-not-allowed rounded-2xl px-4 py-5 opacity-60"
            >
              <Lock className="mx-auto h-4 w-4 text-gold/70" />
              <div className="font-royal mt-2.5 text-[12.5px] font-semibold tracking-wide text-ink">
                {capability}
              </div>
              <div className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-ink-faint">
                Coming next phase
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 max-w-md text-[12px] leading-relaxed text-ink-faint">
          FanalytiX only opens arenas it can serve with real data. Football is
          open today; {config.label} is on its way.
        </p>
      </main>
    </motion.div>
  );
}
