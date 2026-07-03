"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Radio, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp, type ViewId } from "@/lib/appState";
import type { Match } from "@/lib/types";
import { isInPlay, stageLabel } from "@/lib/matchUtils";

interface DockAnswer {
  text: string;
  tone: "ok" | "miss";
}

/**
 * The home entry point: a liquid-glass ask-bar over the REAL loaded
 * dataset. It resolves team/match mentions and view intents — it is a
 * smart command bar, not a language model, and it never invents data.
 */
export default function PromptDock() {
  const { data, selectMatch, setAnalysisOpen, setView, consumeInitialQuery } =
    useApp();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<DockAnswer | null>(null);

  const pool = useMemo(
    () =>
      data.seasonMatches.length
        ? data.seasonMatches
        : [...data.liveMatches, ...data.todayMatches],
    [data.seasonMatches, data.liveMatches, data.todayMatches],
  );

  /** Suggestion chips from real data: live now > next up > insights. */
  const suggestions = useMemo(() => {
    const chips: Array<{ label: string; run: () => void; live?: boolean }> = [];
    const live = data.liveMatches[0];
    if (live) {
      chips.push({
        label: `${live.homeTeam.shortName ?? live.homeTeam.name} vs ${live.awayTeam.shortName ?? live.awayTeam.name}`,
        live: true,
        run: () => focusMatch(live),
      });
    }
    const next = pool.find(
      (m) => m.status === "SCHEDULED" || m.status === "TIMED",
    );
    if (next && chips.length < 2) {
      chips.push({
        label: `${next.homeTeam.shortName ?? next.homeTeam.name} vs ${next.awayTeam.shortName ?? next.awayTeam.name}`,
        run: () => focusMatch(next),
      });
    }
    chips.push({
      label: "Tournament insights",
      run: () => setView("insights"),
    });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.liveMatches, pool]);

  const focusMatch = (m: Match) => {
    selectMatch(m.id);
    setAnalysisOpen(true);
    setAnswer({
      text: `Reading global emotion for ${m.homeTeam.shortName ?? m.homeTeam.name} vs ${m.awayTeam.shortName ?? m.awayTeam.name} — ${stageLabel(m)}${isInPlay(m.status) ? " · LIVE" : ""}`,
      tone: "ok",
    });
  };

  const runQuery = (raw: string) => {
    const q = raw.trim().toLowerCase();
    if (!q) return;

    if (!data.configured) {
      setAnswer({
        text: "No data provider connected — I can only analyse real World Cup data.",
        tone: "miss",
      });
      return;
    }

    // View intents
    const viewIntents: Array<[RegExp, ViewId, string]> = [
      [/standing|table|group/, "teams", "Opening the real group tables."],
      [/fixture|schedule|result|matches/, "matches", "Opening the tournament schedule."],
      [/insight|stat|goal/, "insights", "Opening insights from real results."],
      [/heatmap|region/, "heatmap", "Opening the regional sentiment heatmap (simulated)."],
      [/compare/, "compare", "Opening team comparison."],
    ];
    for (const [re, view, text] of viewIntents) {
      if (re.test(q)) {
        setView(view);
        setAnswer({ text, tone: "ok" });
        setQuery("");
        return;
      }
    }

    // Team / match resolution against real data
    const mentions = (m: Match) =>
      [m.homeTeam, m.awayTeam].filter(
        (t) =>
          q.includes(t.name.toLowerCase()) ||
          (t.shortName && q.includes(t.shortName.toLowerCase())) ||
          (t.tla && new RegExp(`\\b${t.tla.toLowerCase()}\\b`).test(q)),
      ).length;

    const scored = pool
      .map((m) => ({ m, score: mentions(m) }))
      .filter((x) => x.score > 0);

    if (scored.length) {
      // Prefer: both teams mentioned > live > upcoming > most recent
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const liveDiff = Number(isInPlay(b.m.status)) - Number(isInPlay(a.m.status));
        if (liveDiff) return liveDiff;
        const upA = a.m.status === "SCHEDULED" || a.m.status === "TIMED";
        const upB = b.m.status === "SCHEDULED" || b.m.status === "TIMED";
        if (upA !== upB) return upA ? -1 : 1;
        return b.m.utcDate.localeCompare(a.m.utcDate);
      });
      focusMatch(scored[0].m);
      setQuery("");
      return;
    }

    setAnswer({
      text: "I couldn’t find that team or match in the real World Cup 2026 data. Try a national team, e.g. “Brazil” or “France vs Paraguay”.",
      tone: "miss",
    });
  };

  const resolve = () => {
    runQuery(query);
  };

  // Resolve the landing-portal query once real data has arrived.
  useEffect(() => {
    if (data.loading || !data.configured) return;
    const initial = consumeInitialQuery();
    if (initial) runQuery(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.loading, data.configured]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center gap-2.5 px-4">
      {/* Response line */}
      <AnimatePresence mode="wait">
        {answer && (
          <motion.div
            key={answer.text}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className={`glass pointer-events-auto max-w-[560px] rounded-2xl px-4 py-2 text-center text-[12.5px] ${
              answer.tone === "ok" ? "text-ink" : "text-ink-dim"
            }`}
          >
            {answer.tone === "ok" && (
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-gold" />
            )}
            {answer.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask bar */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="glass pointer-events-auto flex w-[min(640px,92vw)] items-center gap-3 rounded-full py-2 pl-5 pr-2"
      >
        <span className="text-[15px]">⚽</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && resolve()}
          placeholder="Whose emotions should I read? Try “Switzerland vs Algeria”…"
          className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-faint"
          aria-label="Analyse a match or team"
        />
        <button
          onClick={resolve}
          aria-label="Analyse"
          className="liquid-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gold"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Real-data suggestion chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.55 }}
        className="pointer-events-auto flex flex-wrap items-center justify-center gap-2"
      >
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={s.run}
            className="liquid-btn flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-medium text-ink-dim hover:text-ink"
          >
            {s.live && (
              <Radio className="live-dot h-3 w-3 rounded-full text-live" />
            )}
            {s.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
