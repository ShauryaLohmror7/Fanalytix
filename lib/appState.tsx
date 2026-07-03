"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Match } from "./types";
import { useWorldCupData, type WorldCupData } from "./useWorldCupData";

/**
 * Client-side application shell state (no persistence — Phase C adds that).
 * One provider at the root owns both the World Cup data stream and all
 * cross-component UI state, so every control can actually drive the app.
 */

export type ViewId =
  | "overview"
  | "matches"
  | "teams"
  | "players"
  | "sentiment"
  | "insights"
  | "alerts"
  | "heatmap"
  | "compare"
  | "bookmarks"
  | "reports"
  | "settings";

const VIEW_IDS: ViewId[] = [
  "overview",
  "matches",
  "teams",
  "players",
  "sentiment",
  "insights",
  "alerts",
  "heatmap",
  "compare",
  "bookmarks",
  "reports",
  "settings",
];

export interface GlobeLayers {
  countries: boolean;
  labels: boolean;
  arcs: boolean;
  seams: boolean;
}

interface AppState {
  data: WorldCupData;

  view: ViewId;
  setView: (view: ViewId) => void;

  /** Explicit user selection overrides the auto-featured match. */
  selectedMatchId: string | null;
  selectMatch: (id: string | null) => void;
  /** Featured = user-selected match if known, else live/next-up heuristic. */
  featuredMatch: Match | null;
  /** Match opened in the detail modal (null = closed). */
  detailMatch: Match | null;
  openMatchDetail: (id: string | null) => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  /** Home analysis overlays (match + sentiment) visible? */
  analysisOpen: boolean;
  setAnalysisOpen: (open: boolean) => void;
  /** Query typed on the landing portal, resolved once data arrives. */
  initialQuery: string | null;
  consumeInitialQuery: () => string | null;
  /** Leave this arena and return to the landing portal. */
  exitExperience: () => void;

  globeLayers: GlobeLayers;
  toggleGlobeLayer: (layer: keyof GlobeLayers) => void;

  /** Session-only bookmarks (match ids) until Phase C persistence. */
  bookmarkIds: string[];
  toggleBookmark: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({
  children,
  initialQuery = null,
  onExit,
}: {
  children: React.ReactNode;
  initialQuery?: string | null;
  onExit?: () => void;
}) {
  const data = useWorldCupData();
  const pendingQuery = useRef<string | null>(initialQuery);

  const [view, setView] = useState<ViewId>("overview");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [detailMatchId, setDetailMatchId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [globeLayers, setGlobeLayers] = useState<GlobeLayers>({
    countries: true,
    labels: true,
    arcs: true,
    seams: true,
  });

  // Deep-linking: honour ?view=matches etc. on first load.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    if (requested && VIEW_IDS.includes(requested as ViewId)) {
      setView(requested as ViewId);
    }
  }, []);

  // Global ⌘K / Ctrl+K for the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const findMatch = useCallback(
    (id: string | null): Match | null => {
      if (!id) return null;
      return (
        data.liveMatches.find((m) => m.id === id) ??
        data.todayMatches.find((m) => m.id === id) ??
        data.seasonMatches.find((m) => m.id === id) ??
        null
      );
    },
    [data.liveMatches, data.todayMatches, data.seasonMatches],
  );

  const featuredMatch = useMemo(
    () => findMatch(selectedMatchId) ?? data.featuredMatch,
    [findMatch, selectedMatchId, data.featuredMatch],
  );

  const detailMatch = useMemo(
    () => findMatch(detailMatchId),
    [findMatch, detailMatchId],
  );

  const toggleGlobeLayer = useCallback((layer: keyof GlobeLayers) => {
    setGlobeLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  }, []);

  const value: AppState = {
    data,
    view,
    setView,
    selectedMatchId,
    selectMatch: setSelectedMatchId,
    featuredMatch,
    detailMatch,
    openMatchDetail: setDetailMatchId,
    paletteOpen,
    setPaletteOpen,
    notificationsOpen,
    setNotificationsOpen,
    analysisOpen,
    setAnalysisOpen,
    initialQuery,
    consumeInitialQuery: () => {
      const q = pendingQuery.current;
      pendingQuery.current = null;
      return q;
    },
    exitExperience: () => onExit?.(),
    globeLayers,
    toggleGlobeLayer,
    bookmarkIds,
    toggleBookmark,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
