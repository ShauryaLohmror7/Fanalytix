/**
 * Event-domain types — the contract every arena is built against.
 *
 * FanalytiX routes a free-text query ("What event do you want to witness?")
 * to an event domain. Each domain declares how it's recognised, whether its
 * arena is open, its provider state, and its theme identity. Nothing here
 * fabricates data: a domain without a connected provider is honestly
 * "coming soon".
 */

export type EventDomain =
  | "football"
  | "space"
  | "markets"
  | "geopolitics"
  | "elections"
  | "generic";

export type ProviderStatus = "connected" | "not_connected";

/**
 * Theme identity metadata — the Phase 3 foundation. These are controlled
 * design-token handles (palette/background/icon/visualization ids), not
 * generated CSS: Phase 3 maps each id to a hand-built luxury visual system.
 */
export interface EventTheme {
  /** data-theme attribute value scoping the arena's design tokens */
  id: string;
  paletteName: string;
  /** Accent hexes for quick reference; full palettes live with the theme */
  accents: string[];
  backgroundStyleId: string;
  iconStyleId: string;
  visualizationStyleId: string;
  /** Copy voice the arena writes in */
  tone: string;
}

export interface EventArenaConfig {
  id: EventDomain;
  label: string;
  tagline: string;
  /** Does a real, working arena exist for this domain today? */
  available: boolean;
  /** Static registry-level provider state; the resolve API can override
      with a live server-side check (e.g. football env credentials). */
  providerStatus: ProviderStatus;
  exampleQueries: string[];
  /** Query recognition patterns; more hits = stronger claim on the query */
  matchers: RegExp[];
  /** Tie-break priority when domains score equally (higher wins) */
  priority: number;
  theme: EventTheme;
  /** What this arena is allowed to look like — guardrails for Phase 3 */
  visualLanguage: string[];
  /** Honest notes about the real data providers this arena will need */
  futureProviderNotes: string;
  /** Capability names shown as disabled "coming next phase" previews */
  comingNext: string[];
}

export interface EventProviderState {
  domain: EventDomain;
  configured: boolean;
  notes?: string;
}

/** Structured result of resolving a query — what the portal routes on. */
export interface EventResolution {
  query: string;
  normalizedQuery: string;
  domain: EventDomain;
  /** Arena to load: an available domain's own arena, else "generic" */
  arenaId: EventDomain | "generic";
  available: boolean;
  providerConfigured: boolean;
  /** Human-readable why: which domain matched and what state it's in */
  reason: string;
  suggestedAction: string;
}
