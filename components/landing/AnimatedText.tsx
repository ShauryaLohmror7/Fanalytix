"use client";

import { motion } from "framer-motion";

/**
 * Text entrances recreated from 21st.dev patterns for the portal:
 * - BlurPullUp  ("Blur In" / "Words Pull Up"): each word rises out of a blur
 * - TrackingReveal ("Letter Spacing"): wide-tracked caps breathing into place
 * Shiny sweep + border beam live in globals.css (.shiny-text, .border-beam).
 */

export function BlurPullUp({
  words,
  className = "",
  delay = 0,
  stagger = 0.09,
  as: Tag = "span",
}: {
  words: Array<{ text: string; className?: string }>;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "p";
}) {
  return (
    <Tag className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w.text}-${i}`}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.7,
            delay: delay + i * stagger,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          className={`inline-block whitespace-pre ${w.className ?? ""}`}
        >
          {w.text}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}

export function TrackingReveal({
  text,
  className = "",
  delay = 0,
  from = "0.9em",
  to = "0.5em",
}: {
  text: string;
  className?: string;
  delay?: number;
  from?: string;
  to?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, letterSpacing: from }}
      animate={{ opacity: 1, letterSpacing: to }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
      className={`inline-block ${className}`}
    >
      {text}
    </motion.span>
  );
}
