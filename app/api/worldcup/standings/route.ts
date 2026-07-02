import { NextResponse } from "next/server";
import { getWorldCupProvider } from "@/lib/worldcupApi";
import type { ApiEnvelope, StandingGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/worldcup/standings — group standings when available. */
export async function GET() {
  const provider = getWorldCupProvider();
  const fetchedAt = new Date().toISOString();

  if (!provider) {
    return NextResponse.json<ApiEnvelope<StandingGroup[]>>({
      configured: false,
      data: null,
      error: "No data provider configured",
      fetchedAt,
    });
  }

  try {
    const standings = await provider.getStandings();
    return NextResponse.json<ApiEnvelope<StandingGroup[]>>({
      configured: true,
      data: standings,
      fetchedAt,
    });
  } catch (err) {
    return NextResponse.json<ApiEnvelope<StandingGroup[]>>(
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
