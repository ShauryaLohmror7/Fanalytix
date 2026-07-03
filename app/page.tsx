"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Hexagon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LunarBackground from "@/components/landing/LunarBackground";
import { BlurPullUp, TrackingReveal } from "@/components/landing/AnimatedText";
import IntroShader from "@/components/IntroShader";
import { EVENT_REGISTRY } from "@/lib/events/registry";
import { resolveEvent } from "@/lib/events/resolveEvent";
import type { EventResolution } from "@/lib/events/types";

// The Football arena is a lazily-loaded module — its code (three.js, charts,
// data providers) only downloads once someone summons a football event.
const FootballExperience = dynamic(
  () => import("@/components/football/FootballExperience"),
  { ssr: false },
);
const GenericArena = dynamic(() => import("@/components/arena/GenericArena"), {
  ssr: false,
});

type Stage =
  | { name: "landing" }
  | { name: "transition"; resolution: EventResolution }
  | { name: "arena"; resolution: EventResolution };

/** One example per major domain — the breadth of the idea in one row. */
const EXAMPLES = (["football", "space", "markets", "elections"] as const).map(
  (id) => EVENT_REGISTRY.find((e) => e.id === id)!.exampleQueries[0],
);

function Landing({
  onSummon,
}: {
  onSummon: (resolution: EventResolution) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (raw: string) => {
    if (!raw.trim()) return;
    // Every summoning is honoured: available arenas open fully, the rest
    // open the honest coming-soon shell — never the wrong arena.
    onSummon(resolveEvent(raw));
  };

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.7 }}
      className="relative flex h-screen w-screen flex-col overflow-hidden"
    >
      <LunarBackground />

      {/* Quiet wordmark */}
      <header className="relative z-10 flex items-center gap-3 px-8 pt-7">
        <motion.div
          initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="gold-glow flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-[#0d1531]"
        >
          <Hexagon className="h-4 w-4 text-gold" strokeWidth={2.2} />
        </motion.div>
        <BlurPullUp
          words={[
            { text: "FanalytiX", className: "font-royal text-[14px] font-bold tracking-[0.16em] text-ink" },
          ]}
          delay={0.15}
        />
      </header>

      {/* The question — below the orb's orbit */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-end px-6 pb-[16vh]">
        <p className="text-[11px] font-medium uppercase text-gold/80">
          <TrackingReveal text="EVENT INTELLIGENCE" delay={0.35} />
        </p>
        <h1 className="font-royal mt-5 max-w-3xl text-center text-[clamp(26px,4.2vw,46px)] font-semibold leading-tight tracking-[0.04em] text-ink">
          <BlurPullUp
            delay={0.7}
            stagger={0.11}
            words={[
              { text: "What" },
              { text: "event" },
              { text: "do" },
              { text: "you" },
              { text: "want" },
              { text: "to" },
              { text: "witness?", className: "shiny-text font-bold" },
            ]}
          />
        </h1>

        {/* The golden glass ask-bar, ringed by a travelling beam */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 1.5, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="border-beam glass mt-11 flex w-[min(620px,92vw)] items-center gap-4 rounded-full border-gold/40 py-3 pl-7 pr-3 shadow-[0_0_60px_rgba(216,180,94,0.12)]"
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(query)}
            placeholder="A match, a tournament, a moment…"
            autoFocus
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            aria-label="What event do you want to witness?"
          />
          <button
            onClick={() => submit(query)}
            aria-label="Witness"
            className="liquid-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gold"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Whispers of what's possible */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {EXAMPLES.map((e, i) => (
            <motion.button
              key={e}
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 2 + i * 0.12 }}
              onClick={() => submit(e)}
              className="liquid-btn rounded-full px-4 py-1.5 text-[12px] text-ink-dim hover:text-ink"
            >
              {e}
            </motion.button>
          ))}
        </div>
      </main>

      {/* Foot whisper */}
      <footer className="relative z-10 pb-6 text-center text-[10px] uppercase text-ink-faint/70">
        <TrackingReveal
          delay={2.5}
          from="0.6em"
          to="0.3em"
          text={`${EVENT_REGISTRY.filter((e) => e.available).length} ARENA OPEN · ${EVENT_REGISTRY.filter((e) => !e.available && e.id !== "generic").length} IN THE MAKING`}
        />
      </footer>
    </motion.div>
  );
}

export default function Page() {
  const [stage, setStage] = useState<Stage>({ name: "landing" });

  // Deep-link/debug: /?arena=football&q=brazil jumps straight into an arena.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const arena = params.get("arena");
    if (arena === "football" || arena === "generic") {
      const resolution = resolveEvent(params.get("q") ?? "");
      setStage({
        name: "arena",
        resolution: { ...resolution, arenaId: arena },
      });
    }
  }, []);

  const inArena = stage.name === "transition" || stage.name === "arena";

  return (
    <>
      <AnimatePresence mode="wait">
        {stage.name === "landing" && (
          <Landing
            onSummon={(resolution) => setStage({ name: "transition", resolution })}
          />
        )}
      </AnimatePresence>

      {/* The portal: the wave shader carries the visitor into the arena */}
      <AnimatePresence>
        {stage.name === "transition" && (
          <IntroShader
            onDone={() => setStage({ name: "arena", resolution: stage.resolution })}
          />
        )}
      </AnimatePresence>

      {/* Mount the arena during the transition so it's already loading
          behind the shader curtain */}
      {inArena &&
        (stage.resolution.arenaId === "football" ? (
          <FootballExperience
            initialQuery={stage.resolution.query}
            onExit={() => setStage({ name: "landing" })}
          />
        ) : (
          <GenericArena
            resolution={stage.resolution}
            onExit={() => setStage({ name: "landing" })}
          />
        ))}
    </>
  );
}
