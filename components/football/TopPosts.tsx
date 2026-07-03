"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart2,
  Heart,
  MessageCircle,
  Repeat2,
  RefreshCw,
  Share,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import type { SocialPost } from "@/lib/types";

const TABS = ["Top Posts", "Latest", "Verified"] as const;
type Tab = (typeof TABS)[number];

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

/**
 * Demo post feed (simulated engine — badge lives on the panel header).
 * Tabs re-order/filter for real; topic filter narrows by hashtag; Load
 * more actually appends another simulated page.
 */
export default function TopPosts({
  posts,
  filterTag,
  onLoadMore,
  loadingMore,
}: {
  posts: SocialPost[];
  filterTag: string | null;
  onLoadMore: () => void;
  loadingMore?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("Top Posts");

  let visible = filterTag
    ? posts.filter((p) => p.tag === filterTag || p.text.includes(filterTag))
    : posts;

  if (tab === "Verified") visible = visible.filter((p) => p.verified);
  else if (tab === "Latest")
    visible = [...visible].sort((a, b) => a.minutesAgo - b.minutesAgo);
  else
    visible = [...visible].sort(
      (a, b) =>
        b.likes + b.reposts + b.replies - (a.likes + a.reposts + a.replies),
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-4">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative pb-2 text-[12px] font-semibold transition-colors ${
              tab === t ? "text-ink" : "text-ink-faint hover:text-ink-dim"
            }`}
          >
            {t}
            {tab === t && (
              <motion.span
                layoutId="posts-tab"
                className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-gold shadow-[0_0_8px_rgba(216,180,94,0.6)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto py-1">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-ink-faint">
            {filterTag
              ? `No ${tab.toLowerCase()} for ${filterTag} yet.`
              : "No posts in this view yet."}
          </p>
        ) : (
          visible.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.06 }}
              className="border-b border-white/[0.04] py-3 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/[0.03] text-ink-dim">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="flex min-w-0 items-center gap-1.5 text-[12px]">
                  <span className="truncate font-bold text-ink">
                    {post.author}
                  </span>
                  {post.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  )}
                  <span className="truncate text-ink-faint">
                    {post.handle} · {post.minutesAgo}m
                  </span>
                </div>
              </div>
              <p className="mt-1.5 pl-[42px] text-[12px] leading-relaxed text-ink-dim">
                {post.text.split(" ").map((word, wi) =>
                  word.startsWith("#") ? (
                    <span key={wi} className="font-semibold text-gold">
                      {word}{" "}
                    </span>
                  ) : (
                    word + " "
                  ),
                )}
              </p>
              <div className="mt-2 flex items-center justify-between pl-[42px] pr-2 text-[11px] text-ink-faint">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {formatCount(post.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <Repeat2 className="h-3.5 w-3.5" /> {formatCount(post.reposts)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />{" "}
                  {formatCount(post.replies)}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 className="h-3.5 w-3.5" />{" "}
                  {formatCount(post.impressions)}
                </span>
                <Share className="h-3.5 w-3.5" />
              </div>
            </motion.article>
          ))
        )}
      </div>

      {/* Load more — appends another simulated page */}
      <div className="border-t border-white/[0.06] py-3">
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="chip flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-semibold text-ink transition-colors hover:text-gold disabled:opacity-50"
        >
          Load more posts
          <RefreshCw
            className={`h-3.5 w-3.5 ${loadingMore ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
