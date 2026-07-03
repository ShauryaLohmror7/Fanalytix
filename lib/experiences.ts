/**
 * Experience registry — FanalytiX arenas.
 *
 * The platform is event-agnostic: a query on the landing portal is matched
 * against registered experiences ("arenas"). Each arena is a self-contained,
 * lazily-loaded module (code + data providers) with its own theme scope, so
 * future arenas (markets, elections, launches…) can ship their own look
 * without touching the shell or each other.
 */

export interface Experience {
  id: string;
  name: string;
  /** data-theme attribute scoping this arena's design tokens */
  theme: string;
  /** Does this query belong to this arena? */
  matches: (query: string) => boolean;
  /** Live today, or a coming-soon placeholder? */
  available: boolean;
  tagline: string;
}

/** Word lists kept intentionally simple — the football arena resolves the
    query precisely against real teams/fixtures once inside. */
const FOOTBALL_TERMS =
  /world cup|fifa|football|soccer|match|fixture|group stage|round of|quarter.?final|semi.?final|final\b|goal|striker|keeper|\bvs\.?\b|versus/i;

/** A few well-known national teams so "brazil" alone finds the arena.
    (Inside the arena, matching runs against the full real dataset.) */
const TEAM_TERMS =
  /brazil|argentina|france|germany|spain|england|portugal|netherlands|italy|mexico|usa|united states|canada|japan|korea|morocco|nigeria|ghana|senegal|egypt|australia|colombia|uruguay|croatia|belgium|switzerland|algeria|turkey|poland|sweden|qatar|saudi/i;

export const EXPERIENCES: Experience[] = [
  {
    id: "football",
    name: "Football",
    theme: "royal-gold",
    matches: (q) => FOOTBALL_TERMS.test(q) || TEAM_TERMS.test(q),
    available: true,
    tagline: "FIFA World Cup 2026 · live",
  },
  {
    id: "markets",
    name: "Markets",
    theme: "ticker-emerald",
    matches: (q) => /ipo|stock|market|earnings|spacex|tesla|nasdaq|crypto|bitcoin/i.test(q),
    available: false,
    tagline: "IPOs & market moments · coming soon",
  },
  {
    id: "world",
    name: "World Events",
    theme: "signal-slate",
    matches: (q) => /war|election|summit|protest|crisis|olympics|launch|hurricane/i.test(q),
    available: false,
    tagline: "Elections, conflicts & launches · coming soon",
  },
];

/** First matching arena, or null when nothing recognises the query. */
export function resolveExperience(query: string): Experience | null {
  const q = query.trim();
  if (!q) return null;
  return EXPERIENCES.find((e) => e.matches(q)) ?? null;
}
