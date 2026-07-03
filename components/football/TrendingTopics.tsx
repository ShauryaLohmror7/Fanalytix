"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { TrendingTopic } from "@/lib/types";

function formatPosts(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

/**
 * Simulated trending topics. Chips act as post-feed filters: clicking a
 * topic narrows the posts list below; clicking again clears it.
 */
export default function TrendingTopics({
  topics,
  selectedTag,
  onSelect,
}: {
  topics: TrendingTopic[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}) {
  return (
    <div className="px-4 pt-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.18em] text-ink-dim">
          TRENDING TOPICS
        </span>
        {selectedTag && (
          <button
            onClick={() => onSelect(null)}
            className="text-[11px] font-medium text-gold/90 hover:text-gold"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {topics.map((topic, i) => {
          const active = topic.tag === selectedTag;
          return (
            <motion.button
              key={topic.tag}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              whileHover={{ y: -2 }}
              onClick={() => onSelect(active ? null : topic.tag)}
              aria-pressed={active}
              className={`chip rounded-xl px-2.5 py-2 text-left transition-colors ${
                active ? "gold-glow border-gold/50 bg-gold/10" : ""
              }`}
            >
              <div
                className={`truncate text-[11px] font-bold ${active ? "text-gold-bright" : "text-ink"}`}
              >
                {topic.tag}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-ink-faint">
                  {formatPosts(topic.posts)} posts
                </span>
                <span className="flex items-center text-[10px] font-semibold text-pos">
                  <ArrowUpRight className="h-3 w-3" />
                  {topic.delta}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
