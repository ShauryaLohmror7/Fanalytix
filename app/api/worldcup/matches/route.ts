import { NextRequest, NextResponse } from "next/server";
import { getWorldCupProvider } from "@/lib/worldcupApi";
import type { ApiEnvelope, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/worldcup/matches — today's matches, any status.
 * GET /api/worldcup/matches?scope=season — the whole tournament schedule.
 */
export async function GET(request: NextRequest) {
  const provider = getWorldCupProvider();
  const fetchedAt = new Date().toISOString();
  const scope = request.nextUrl.searchParams.get("scope");

  if (!provider) {
    return NextResponse.json<ApiEnvelope<Match[]>>({
      configured: false,
      data: null,
      error: "No data provider configured",
      fetchedAt,
    });
  }

  try {
    const matches =
      scope === "season"
        ? await provider.getSeasonMatches()
        : await provider.getTodayMatches();
    return NextResponse.json<ApiEnvelope<Match[]>>({
      configured: true,
      data: matches,
      fetchedAt,
    });
  } catch (err) {
    return NextResponse.json<ApiEnvelope<Match[]>>(
      {
        configured: true,
        data: null,
        error: err instanceof Error ? err.message : "Provider request failed",
        fetchedAt,
      },
      { status: 502 },
    );
  }
}
