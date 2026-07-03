"use client";

import { PlugZap, Shield, Table2 } from "lucide-react";
import { useApp } from "@/lib/appState";
import ViewShell from "./ViewShell";
import { CenteredState } from "../LiveMatchPanel";

/** Real group standings from the provider — final tables once groups end. */
export default function TeamsView() {
  const { data } = useApp();
  const { standings, configured, loading } = data;

  return (
    <ViewShell
      title="TEAMS & STANDINGS"
      subtitle={
        configured && standings.length
          ? `${standings.length} groups · Group-stage tables`
          : undefined
      }
    >
      {!configured ? (
        <CenteredState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connect data provider"
          body="Set WORLDCUP_API_BASE_URL and WORLDCUP_API_KEY to load real group standings."
        />
      ) : loading && standings.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : standings.length === 0 ? (
        <CenteredState
          icon={<Table2 className="h-5 w-5" />}
          title="Standings unavailable"
          body="The provider hasn’t published standings for this competition yet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
          {standings.map((group) => (
            <div key={group.group} className="well overflow-hidden rounded-xl">
              <div className="border-b border-white/[0.06] px-4 py-2.5 text-[11px] font-bold tracking-[0.18em] text-gold">
                {group.group.toUpperCase()}
              </div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint">
                    <th className="py-2 pl-4 pr-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">Team</th>
                    <th className="px-2 py-2 text-center font-medium">P</th>
                    <th className="px-2 py-2 text-center font-medium">W</th>
                    <th className="px-2 py-2 text-center font-medium">D</th>
                    <th className="px-2 py-2 text-center font-medium">L</th>
                    <th className="px-2 py-2 text-center font-medium">GD</th>
                    <th className="py-2 pl-2 pr-4 text-center font-medium">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => {
                    // Top two qualify in a standard group — gold marker.
                    const qualifies = row.position <= 2;
                    return (
                      <tr
                        key={row.team.id}
                        className="border-t border-white/[0.04] text-ink"
                      >
                        <td className="py-2 pl-4 pr-2 tabular-nums">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ${
                              qualifies
                                ? "bg-gold/15 text-gold"
                                : "text-ink-faint"
                            }`}
                          >
                            {row.position}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="flex items-center gap-2">
                            {row.team.crestUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.team.crestUrl}
                                alt=""
                                className="h-5 w-5 object-contain"
                              />
                            ) : (
                              <Shield className="h-4 w-4 text-ink-faint" />
                            )}
                            <span className="font-semibold">
                              {row.team.shortName ?? row.team.name}
                            </span>
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-ink-dim">
                          {row.played}
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-ink-dim">
                          {row.won}
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-ink-dim">
                          {row.draw}
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-ink-dim">
                          {row.lost}
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums text-ink-dim">
                          {row.goalDifference > 0
                            ? `+${row.goalDifference}`
                            : row.goalDifference}
                        </td>
                        <td className="py-2 pl-2 pr-4 text-center font-bold tabular-nums">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </ViewShell>
  );
}
