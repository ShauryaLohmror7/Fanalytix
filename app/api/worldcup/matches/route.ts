import { NextResponse } from "next/server";
import { getWorldCupProvider } from "@/lib/worldcupApi";
import type { ApiEnvelope, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/worldcup/matches — today's matches, any status. */
export async function GET() {
  const provider = getWorldCupProvider();
  const fetchedAt = new Date().toISOString();

  if (!provider) {
    return NextResponse.json<ApiEnvelope<Match[]>>({
      configured: false,
      data: null,
      error: "No data provider configured",
      fetchedAt,
    });
  }

  try {
    const matches = await provider.getTodayMatches();
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
