import type {
  SentimentPoint,
  SentimentSnapshot,
  SocialPost,
  TrendingTopic,
} from "./types";

/**
 * SIMULATED sentiment engine.
 *
 * There is no social API connected yet, so this module synthesizes a
 * plausible, smoothly-varying sentiment stream. Every snapshot is tagged
 * `source: "simulated"` and the UI surfaces that badge — we never present
 * this as real social data.
 *
 * To go live: implement a function with the same return type backed by a
 * real social listening API and flip `source` to "live".
 */

/** Deterministic pseudo-random stream so the numbers don't jitter randomly. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hashtags derived from whatever match context we actually have. */
export function buildTopicTags(context?: {
  homeTla?: string;
  awayTla?: string;
}): string[] {
  const tags = ["#WorldCup2026", "#FIFAWC26"];
  if (context?.homeTla && context?.awayTla) {
    tags.unshift(
      `#${context.homeTla}${context.awayTla}`,
      `#${context.homeTla}`,
      `#${context.awayTla}`,
    );
  } else {
    tags.push("#Football", "#RoadTo26");
  }
  return tags.slice(0, 3);
}

export function generateSentimentSnapshot(context?: {
  homeTla?: string;
  awayTla?: string;
  homeName?: string;
  awayName?: string;
}): SentimentSnapshot {
  // Seed on a 5-minute bucket: values evolve over time but stay stable
  // between renders within a bucket.
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
  const rand = mulberry32(bucket * 2654435761);

  const series: SentimentPoint[] = [];
  let pos = 52 + rand() * 20;
  let neg = 14 + rand() * 10;
  let volume = 6000 + rand() * 4000;
  for (let minutesAgo = 60; minutesAgo >= 0; minutesAgo -= 5) {
    pos = clamp(pos + (rand() - 0.45) * 6, 35, 82);
    neg = clamp(neg + (rand() - 0.5) * 4, 8, 34);
    // Random walk keeps the volume bars reading as a coherent trend.
    volume = clamp(volume * (1 + (rand() - 0.44) * 0.16), 3000, 14000);
    const neu = clamp(100 - pos - neg, 4, 40);
    series.push({
      minutesAgo,
      positive: Math.round(pos),
      negative: Math.round(neg),
      neutral: Math.round(neu),
      volume: Math.round(volume),
    });
  }

  const now = series[series.length - 1];
  const first = series[0];
  const tags = buildTopicTags(context);

  const topics: TrendingTopic[] = tags.map((tag, i) => ({
    tag,
    posts: Math.round(24000 / (i + 1) + rand() * 4000),
    delta: Math.round(rand() * 9) + 1,
  }));

  const home = context?.homeName ?? "the favorites";
  const away = context?.awayName ?? "the underdogs";
  const postTexts = [
    `The intensity in this ${home} vs ${away} game is unreal. World Cup football at its best. ${tags[0]}`,
    `Midfield battle is deciding everything right now. ${away} need to adjust before it slips away. ${tags[0]}`,
    `Atmosphere in the stadium looks incredible tonight. This is why we love the World Cup. #WorldCup2026`,
  ];
  const authors: Array<[string, string, boolean]> = [
    ["Sample Analyst", "@fanalytix_demo", true],
    ["The Football Corner", "@tfc_demo", false],
    ["Matchday Voices", "@matchday_demo", false],
  ];

  const posts: SocialPost[] = postTexts.map((text, i) => ({
    id: `sim-${bucket}-${i}`,
    author: authors[i][0],
    handle: authors[i][1],
    verified: authors[i][2],
    minutesAgo: Math.round(2 + rand() * 8) * (i + 1),
    text,
    tag: tags[Math.min(i, tags.length - 1)],
    likes: Math.round(20 + rand() * 160),
    reposts: Math.round(10 + rand() * 120),
    replies: Math.round(30 + rand() * 480),
    impressions: Math.round(6000 + rand() * 9000),
  }));

  return {
    source: "simulated",
    positive: now.positive,
    negative: now.negative,
    neutral: now.neutral,
    trendDeltaPct: Math.round(((now.positive - first.positive) / first.positive) * 100),
    volumeDeltaPct: Math.round(((now.volume - first.volume) / first.volume) * 100),
    series,
    topics,
    posts,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
