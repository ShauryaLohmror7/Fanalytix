"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { TrendingTopic } from "@/lib/types";

function formatPosts(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

export default function TrendingTopics({ topics }: { topics: TrendingTopic[] }) {
  return (
    <div className="px-4 pt-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-200">
            TRENDING TOPICS
          </span>
        </div>
        <button className="text-[11px] font-medium text-neon-green/80 hover:text-neon-green">
          View All
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {topics.map((topic, i) => (
          <motion.button
            key={topic.tag}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
            whileHover={{ y: -2 }}
            className="glass-chip rounded-xl px-2.5 py-2 text-left transition-colors hover:border-neon-green/30"
          >
            <div className="truncate text-[11px] font-bold text-white">
              {topic.tag}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {formatPosts(topic.posts)} posts
              </span>
              <span className="flex items-center text-[10px] font-semibold text-neon-green">
                <ArrowUpRight className="h-3 w-3" />
                {topic.delta}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
