import type { EventArenaConfig, EventDomain } from "./types";

/**
 * The arena registry — one entry per event domain.
 *
 * Adding an arena: add its config here, build its module under
 * components/<domain>/, and wire the arena id in app/page.tsx. Theme ids
 * are handles for Phase 3's hand-built visual systems.
 */

/** Well-known national teams so a bare "brazil" reaches the football
    arena; precise matching happens inside against the real dataset. */
const FOOTBALL_TEAMS =
  /brazil|argentina|france|germany|spain|england|portugal|netherlands|italy|mexico|\busa\b|united states|canada|japan|korea|morocco|nigeria|ghana|senegal|egypt|australia|colombia|uruguay|croatia|belgium|switzerland|algeria|turkey|poland|sweden|qatar|saudi/i;

export const EVENT_REGISTRY: EventArenaConfig[] = [
  {
    id: "football",
    label: "Football",
    tagline: "FIFA World Cup 2026 · live",
    available: true,
    providerStatus: "connected",
    exampleQueries: ["FIFA World Cup 2026", "Switzerland vs Algeria", "Brazil"],
    matchers: [
      /world cup|fifa|football|soccer|match|fixture|group stage|round of|quarter.?final|semi.?final|final\b|goal|striker|keeper|\bvs\.?\b|versus/i,
      FOOTBALL_TEAMS,
    ],
    priority: 100,
    theme: {
      id: "royal-gold",
      paletteName: "Royal Gold",
      accents: ["#d8b45e", "#4ade80", "#f43f5e"],
      backgroundStyleId: "stadium-cathedral",
      iconStyleId: "engraved-line",
      visualizationStyleId: "gilded-charts",
      tone: "broadcast-royal",
    },
    visualLanguage: [
      "lapis + trophy gold",
      "engraved frames, laurels, statues",
      "emotion ramp on the globe",
    ],
    futureProviderNotes:
      "Live: football-data.org v4 (fixtures, results, standings). Wanted: event/minute/stat feed, social sentiment API.",
    comingNext: ["Persistent bookmarks", "Clickable globe", "Player arena"],
  },
  {
    id: "space",
    label: "Space",
    tagline: "Launches & missions · coming soon",
    available: false,
    providerStatus: "not_connected",
    exampleQueries: ["SpaceX Starship launch", "NASA Artemis", "Falcon 9"],
    matchers: [
      /spacex|starship|nasa|falcon|rocket|launch|orbit|mission|astronaut|artemis|satellite|space station|\biss\b/i,
    ],
    priority: 40,
    theme: {
      id: "void-chrome",
      paletteName: "Void Chrome",
      accents: ["#9ec4ff", "#e8e6df", "#d8b45e"],
      backgroundStyleId: "deep-field",
      iconStyleId: "telemetry-line",
      visualizationStyleId: "trajectory-plots",
      tone: "mission-control",
    },
    visualLanguage: [
      "near-black void, chrome + ice blue",
      "telemetry readouts, countdowns, trajectories",
      "no gold excess — engineered calm",
    ],
    futureProviderNotes:
      "Candidates: Launch Library 2 API (launches), NASA open APIs, Space-Track.",
    comingNext: ["Launch countdowns", "Trajectory view", "Mission telemetry"],
  },
  {
    id: "markets",
    label: "Markets",
    tagline: "IPOs & market moments · coming soon",
    available: false,
    providerStatus: "not_connected",
    exampleQueries: ["SpaceX IPO", "NVIDIA earnings", "Bitcoin halving"],
    matchers: [
      /\bipo\b|stock|share price|market|earnings|nasdaq|nyse|crypto|bitcoin|ethereum|listing|valuation|ticker|dividend|merger|acquisition/i,
    ],
    priority: 60,
    theme: {
      id: "ledger-emerald",
      paletteName: "Ledger Emerald",
      accents: ["#34d399", "#f43f5e", "#e8e6df"],
      backgroundStyleId: "trading-floor-dusk",
      iconStyleId: "serif-numeric",
      visualizationStyleId: "candles-and-tape",
      tone: "private-banking",
    },
    visualLanguage: [
      "deep green baize, ivory, brass",
      "ticker tape, ledgers, candlesticks",
      "quiet money — no neon casino",
    ],
    futureProviderNotes:
      "Candidates: Polygon.io / Alpha Vantage (quotes), SEC EDGAR (filings), exchange calendars.",
    comingNext: ["Listing timeline", "Order-book pulse", "Filing intelligence"],
  },
  {
    id: "geopolitics",
    label: "Geopolitics",
    tagline: "Situations & summits · coming soon",
    available: false,
    providerStatus: "not_connected",
    exampleQueries: ["Ceasefire talks", "UN Security Council", "Border crisis"],
    matchers: [
      /\bwar\b|conflict|ceasefire|crisis|invasion|sanction|summit|treaty|nato|united nations|\bun\b|geopolit|diplomac|coup|protest/i,
    ],
    priority: 50,
    theme: {
      id: "signal-slate",
      paletteName: "Signal Slate",
      accents: ["#cbd5e1", "#eab308", "#f43f5e"],
      backgroundStyleId: "situation-room",
      iconStyleId: "cartographic",
      visualizationStyleId: "map-overlays",
      tone: "briefing-room",
    },
    visualLanguage: [
      "graphite, parchment, signal amber",
      "maps, corridors, timelines",
      "sober — never gamified conflict",
    ],
    futureProviderNotes:
      "Candidates: GDELT, ACLED, ReliefWeb. Requires careful sourcing and framing review.",
    comingNext: ["Situation map", "Timeline of record", "Source ledger"],
  },
  {
    id: "elections",
    label: "Elections",
    tagline: "Civic signal · coming soon",
    available: false,
    providerStatus: "not_connected",
    exampleQueries: ["US election", "Exit polls", "Presidential debate"],
    matchers: [
      /election|polling|exit poll|ballot|candidate|\bvote\b|voting|referendum|primaries|primary race|debate|swing state|electoral/i,
    ],
    priority: 55,
    theme: {
      id: "civic-ivory",
      paletteName: "Civic Ivory",
      accents: ["#e8e6df", "#608ceb", "#f43f5e"],
      backgroundStyleId: "marble-forum",
      iconStyleId: "ballot-line",
      visualizationStyleId: "choropleth-and-needles",
      tone: "public-record",
    },
    visualLanguage: [
      "ivory marble, twin accent pair",
      "choropleths, tally boards",
      "strictly neutral presentation",
    ],
    futureProviderNotes:
      "Candidates: official electoral commissions, AP Elections API. Neutrality review required.",
    comingNext: ["Live tally board", "District map", "Turnout signal"],
  },
  {
    id: "generic",
    label: "Observatory",
    tagline: "Any moment worth watching",
    available: false,
    providerStatus: "not_connected",
    exampleQueries: ["Met Gala", "Olympics 2028", "Eurovision final"],
    matchers: [], // fallback — never matched, always the last resort
    priority: 0,
    theme: {
      id: "sapphire-veil",
      paletteName: "Sapphire Veil",
      accents: ["#d8b45e", "#9ec4ff"],
      backgroundStyleId: "observatory-night",
      iconStyleId: "celestial-line",
      visualizationStyleId: "constellation",
      tone: "curator",
    },
    visualLanguage: [
      "sapphire night, single gold thread",
      "orbital rings, constellations",
      "the house style of the portal itself",
    ],
    futureProviderNotes:
      "Long-term: pluggable news/sentiment providers with per-event vetting.",
    comingNext: ["Event timeline", "Global attention", "Moment archive"],
  },
];

export function getArenaConfig(domain: EventDomain): EventArenaConfig {
  return (
    EVENT_REGISTRY.find((e) => e.id === domain) ??
    EVENT_REGISTRY[EVENT_REGISTRY.length - 1]
  );
}
