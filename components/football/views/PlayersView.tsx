"use client";

import { Users } from "lucide-react";
import ViewShell from "./ViewShell";
import { CenteredState } from "../LiveMatchPanel";

/**
 * Honest placeholder: player-level data (top scorers, squads) requires a
 * dedicated provider endpoint that is wired in a later phase. No fake
 * player statistics are ever shown.
 */
export default function PlayersView() {
  return (
    <ViewShell title="PLAYERS" subtitle="Top scorers & squads">
      <CenteredState
        icon={<Users className="h-5 w-5" />}
        title="Player data arrives in a later phase"
        body="Top scorers and squad data need an additional provider endpoint that isn’t wired yet. FanalytiX shows no player statistics until they’re real."
      />
    </ViewShell>
  );
}
