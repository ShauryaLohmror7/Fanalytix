"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useApp } from "@/lib/appState";
import ViewShell, { PhaseNote } from "./ViewShell";

const PREFS = [
  { id: "kickoff", label: "Kickoff reminders", detail: "15 minutes before every World Cup match" },
  { id: "fulltime", label: "Full-time results", detail: "Final score as soon as a match finishes" },
  { id: "live", label: "Live match alerts", detail: "When a match goes in play" },
  { id: "bookmarked", label: "Bookmarked matches only", detail: "Limit alerts to matches you’ve pinned" },
] as const;

/**
 * Alert preferences — functional local toggles that drive the in-app
 * notifications drawer filter today; push delivery + persistence are a
 * later phase.
 */
export default function AlertsView() {
  const { setNotificationsOpen } = useApp();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    kickoff: true,
    fulltime: true,
    live: true,
    bookmarked: false,
  });

  return (
    <ViewShell
      title="ALERTS"
      subtitle="In-app match alerts from real fixture data"
      actions={
        <button
          onClick={() => setNotificationsOpen(true)}
          className="chip flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold text-ink transition-colors hover:text-gold"
        >
          <Bell className="h-3.5 w-3.5" />
          Open alerts drawer
        </button>
      }
    >
      <div className="mx-auto w-full max-w-xl p-6">
        <div className="well rounded-xl">
          {PREFS.map((p, i) => (
            <label
              key={p.id}
              className={`flex cursor-pointer items-center justify-between gap-4 px-5 py-4 ${
                i > 0 ? "border-t border-white/[0.05]" : ""
              }`}
            >
              <span>
                <span className="block text-[13px] font-semibold text-ink">
                  {p.label}
                </span>
                <span className="text-[11.5px] text-ink-faint">{p.detail}</span>
              </span>
              <input
                type="checkbox"
                checked={prefs[p.id]}
                onChange={() =>
                  setPrefs((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                }
                className="h-4 w-4 shrink-0 accent-[#d8b45e]"
              />
            </label>
          ))}
        </div>
      </div>
      <PhaseNote text="These preferences are session-only and apply to the in-app alerts drawer. Saved preferences and push delivery arrive with backend persistence in the next phase." />
    </ViewShell>
  );
}
