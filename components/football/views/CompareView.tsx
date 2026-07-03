"use client";

import { useMemo, useState } from "react";
import { PlugZap, Scale } from "lucide-react";
import { useApp } from "@/lib/appState";
import type { Match, Team } from "@/lib/types";
import { matchDayLabel } from "@/lib/matchUtils";
import ViewShell from "./ViewShell";
import { CenteredState } from "../LiveMatchPanel";

interface TeamRecord {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Aggregate a team's real tournament record from finished matches. */
function buildRecord(team: Team, matches: Match[]): TeamRecord {
  const rec: TeamRecord = {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
  for (const m of matches) {
    if (m.status !== "FINISHED" || m.homeScore == null) continue;
    const isHome = m.homeTeam.id === team.id;
    const isAway = m.awayTeam.id === team.id;
    if (!isHome && !isAway) continue;
    const gf = isHome ? m.homeScore : (m.awayScore ?? 0);
    const ga = isHome ? (m.awayScore ?? 0) : m.homeScore;
    rec.played++;
    rec.goalsFor += gf;
    rec.goalsAgainst += ga;
    if (gf > ga) rec.won++;
    else if (gf === ga) rec.drawn++;
    else rec.lost++;
  }
  return rec;
}

function CompareRow({
  label,
  a,
  b,
  higherIsBetter = true,
}: {
  label: string;
  a: number;
  b: number;
  higherIsBetter?: boolean;
}) {
  const aBest = higherIsBetter ? a > b : a < b;
  const bBest = higherIsBetter ? b > a : b < a;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/[0.04] py-2.5 last:border-0">
      <span
        className={`text-right text-[15px] font-bold tabular-nums ${aBest ? "text-gold" : "text-ink"}`}
      >
        {a}
      </span>
      <span className="w-36 text-center text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </span>
      <span
        className={`text-[15px] font-bold tabular-nums ${bBest ? "text-gold" : "text-ink"}`}
      >
        {b}
      </span>
    </div>
  );
}

/** Real two-team comparison from this tournament's results only. */
export default function CompareView() {
  const { data } = useApp();
  const pool = data.seasonMatches;

  const teams = useMemo(() => {
    const byId = new Map<string, Team>();
    for (const m of pool) {
      if (m.homeTeam.id) byId.set(m.homeTeam.id, m.homeTeam);
      if (m.awayTeam.id) byId.set(m.awayTeam.id, m.awayTeam);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [pool]);

  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");
  const teamA = teams.find((t) => t.id === idA) ?? null;
  const teamB = teams.find((t) => t.id === idB) ?? null;

  const recA = useMemo(
    () => (teamA ? buildRecord(teamA, pool) : null),
    [teamA, pool],
  );
  const recB = useMemo(
    () => (teamB ? buildRecord(teamB, pool) : null),
    [teamB, pool],
  );

  /** Real meetings between the two inside this tournament. */
  const meetings = useMemo(() => {
    if (!teamA || !teamB) return [];
    return pool.filter(
      (m) =>
        (m.homeTeam.id === teamA.id && m.awayTeam.id === teamB.id) ||
        (m.homeTeam.id === teamB.id && m.awayTeam.id === teamA.id),
    );
  }, [teamA, teamB, pool]);

  const selectCls =
    "chip w-full rounded-xl bg-navy-850 px-3 py-2.5 text-[13px] font-semibold text-ink outline-none";

  return (
    <ViewShell
      title="COMPARE TEAMS"
      subtitle="Tournament records computed from real results"
    >
      {!data.configured ? (
        <CenteredState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connect data provider"
          body="Team comparison uses real tournament results — connect a provider first."
        />
      ) : teams.length < 2 ? (
        <CenteredState
          icon={<Scale className="h-5 w-5" />}
          title="Not enough data yet"
          body="Team records appear once the tournament schedule has loaded."
        />
      ) : (
        <div className="mx-auto w-full max-w-2xl p-6">
          {/* Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <select
              aria-label="First team"
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className={selectCls}
            >
              <option value="">Select team…</option>
              {teams
                .filter((t) => t.id !== idB)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <select
              aria-label="Second team"
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className={selectCls}
            >
              <option value="">Select team…</option>
              {teams
                .filter((t) => t.id !== idA)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {recA && recB && teamA && teamB ? (
            <div className="mt-6">
              {/* Header crests */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pb-4">
                <div className="flex flex-col items-end gap-1.5">
                  {teamA.crestUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={teamA.crestUrl} alt="" className="h-12 w-12 object-contain" />
                  )}
                  <span className="text-[13px] font-bold text-ink">
                    {teamA.shortName ?? teamA.name}
                  </span>
                </div>
                <span className="text-[11px] font-semibold tracking-[0.2em] text-ink-faint">
                  VS
                </span>
                <div className="flex flex-col items-start gap-1.5">
                  {teamB.crestUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={teamB.crestUrl} alt="" className="h-12 w-12 object-contain" />
                  )}
                  <span className="text-[13px] font-bold text-ink">
                    {teamB.shortName ?? teamB.name}
                  </span>
                </div>
              </div>

              <div className="well rounded-xl px-5 py-2">
                <CompareRow label="Played" a={recA.played} b={recB.played} />
                <CompareRow label="Wins" a={recA.won} b={recB.won} />
                <CompareRow label="Draws" a={recA.drawn} b={recB.drawn} />
                <CompareRow label="Losses" a={recA.lost} b={recB.lost} higherIsBetter={false} />
                <CompareRow label="Goals scored" a={recA.goalsFor} b={recB.goalsFor} />
                <CompareRow label="Goals conceded" a={recA.goalsAgainst} b={recB.goalsAgainst} higherIsBetter={false} />
              </div>

              {/* Real tournament meetings */}
              <div className="mt-4">
                <div className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-ink-dim">
                  MEETINGS THIS TOURNAMENT
                </div>
                {meetings.length ? (
                  meetings.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between border-b border-white/[0.04] py-2 text-[12.5px] last:border-0"
                    >
                      <span className="text-ink">
                        {m.homeTeam.shortName ?? m.homeTeam.name}
                        <span className="mx-1.5 font-bold tabular-nums">
                          {m.homeScore != null
                            ? `${m.homeScore}–${m.awayScore ?? 0}`
                            : "vs"}
                        </span>
                        {m.awayTeam.shortName ?? m.awayTeam.name}
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {matchDayLabel(m.utcDate)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-2 text-[12px] text-ink-faint">
                    These teams haven’t met in this tournament. Historical
                    head-to-head data isn’t included in the current data plan.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-[12.5px] text-ink-dim">
              Pick two national teams to compare their real World Cup 2026
              records.
            </p>
          )}
        </div>
      )}
    </ViewShell>
  );
}
