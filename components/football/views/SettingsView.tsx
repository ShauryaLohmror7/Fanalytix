"use client";

import { CheckCircle2, PlugZap, RefreshCw } from "lucide-react";
import { useApp } from "@/lib/appState";
import ViewShell, { PhaseNote } from "./ViewShell";

function Row({
  label,
  value,
  valueClass = "text-ink",
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3.5 text-[12.5px] first:border-0">
      <span className="text-ink-dim">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

/** Real connection status + data cadence. Config itself lives in env vars. */
export default function SettingsView() {
  const { data } = useApp();

  return (
    <ViewShell
      title="SETTINGS"
      subtitle="Data connection & refresh behaviour"
      actions={
        <button
          onClick={data.refresh}
          className="chip flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold text-ink transition-colors hover:text-gold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh data now
        </button>
      }
    >
      <div className="mx-auto w-full max-w-xl p-6">
        <div className="well rounded-xl">
          <Row
            label="Football data provider"
            value={
              data.configured ? (
                <span className="flex items-center gap-1.5 text-live">
                  <CheckCircle2 className="h-4 w-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-warn">
                  <PlugZap className="h-4 w-4" /> Not configured
                </span>
              )
            }
          />
          <Row
            label="Live & today refresh"
            value="Every 45 seconds"
            valueClass="text-ink-dim"
          />
          <Row
            label="Season & standings refresh"
            value="Every 5 minutes"
            valueClass="text-ink-dim"
          />
          <Row
            label="Social sentiment source"
            value={<span className="text-warn">Simulated (placeholder)</span>}
          />
          <Row
            label="Theme"
            value="Broadcast dark"
            valueClass="text-ink-dim"
          />
        </div>

        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-[12px] leading-relaxed text-ink-dim">
          Provider credentials are configured server-side via{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-ink">
            WORLDCUP_API_BASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-ink">
            WORLDCUP_API_KEY
          </code>{" "}
          in <code className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-ink">.env.local</code>{" "}
          — keys never reach the browser.
        </div>
      </div>
      <PhaseNote text="Editable preferences (poll cadence, default view, alert rules) become available once backend persistence lands in the next phase." />
    </ViewShell>
  );
}
