"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Hexagon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LunarBackground from "@/components/landing/LunarBackground";
import { BlurPullUp, TrackingReveal } from "@/components/landing/AnimatedText";
import IntroShader from "@/components/IntroShader";
import { EXPERIENCES, resolveExperience } from "@/lib/experiences";

// The Football arena is a lazily-loaded module — its code (three.js, charts,
// data providers) only downloads once someone summons a football event.
const FootballExperience = dynamic(
  () => import("@/components/football/FootballExperience"),
  { ssr: false },
);

type Stage =
  | { name: "landing" }
  | { name: "transition"; query: string }
  | { name: "football"; query: string };

/** One elegant example per arena — shows the breadth of the idea. */
const EXAMPLES = ["FIFA World Cup 2026", "Switzerland vs Algeria", "SpaceX IPO"];

function Landing({ onSummon }: { onSummon: (query: string) => void }) {
  const [query, setQuery] = useState("");
  const [miss, setMiss] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const exp = resolveExperience(q);
    if (exp?.available) {
      onSummon(q);
      return;
    }
    setMiss(
      exp
        ? `${exp.name} — ${exp.tagline}. The Football arena is open today.`
        : "That arena hasn’t been built yet. Football is open today — more worlds are coming.",
    );
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
            onChange={(e) => {
              setQuery(e.target.value);
              if (miss) setMiss(null);
            }}
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

        {/* Gentle guidance, only when needed */}
        <AnimatePresence mode="wait">
          {miss && (
            <motion.p
              key={miss}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 max-w-md text-center text-[12.5px] leading-relaxed text-ink-dim"
            >
              {miss}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Three whispers of what's possible */}
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
          text={`${EXPERIENCES.filter((e) => e.available).length} ARENA OPEN · ${EXPERIENCES.filter((e) => !e.available).length} IN THE MAKING`}
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
    if (params.get("arena") === "football") {
      setStage({ name: "football", query: params.get("q") ?? "" });
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {stage.name === "landing" && (
          <Landing onSummon={(query) => setStage({ name: "transition", query })} />
        )}
      </AnimatePresence>

      {/* The portal: the wave shader carries the visitor into the arena */}
      <AnimatePresence>
        {stage.name === "transition" && (
          <IntroShader
            onDone={() => setStage({ name: "football", query: stage.query })}
          />
        )}
      </AnimatePresence>

      {/* Mount the arena during the transition so the world is already
          loading behind the shader curtain */}
      {(stage.name === "transition" || stage.name === "football") && (
        <FootballExperience
          initialQuery={stage.query}
          onExit={() => setStage({ name: "landing" })}
        />
      )}
    </>
  );
}
