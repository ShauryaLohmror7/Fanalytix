import { NextRequest, NextResponse } from "next/server";
import { resolveEvent } from "@/lib/events/resolveEvent";
import { isProviderConfigured } from "@/lib/worldcupApi";
import type { EventResolution } from "@/lib/events/types";

/**
 * GET  /api/events/resolve?q=<query>
 * POST /api/events/resolve  { "query": "<query>" }
 *
 * Returns the typed EventResolution for a query, with live server-side
 * provider state merged in (currently: the football arena's credentials).
 * No external calls, no fabricated data — resolution only.
 */

function resolve(query: string): EventResolution {
  return resolveEvent(query, [
    { domain: "football", configured: isProviderConfigured() },
  ]);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json(
      { error: "Missing query — pass ?q=<event>" },
      { status: 400 },
    );
  }
  return NextResponse.json(resolve(q));
}

export async function POST(request: NextRequest) {
  let query = "";
  try {
    const body = (await request.json()) as { query?: string };
    query = body.query ?? "";
  } catch {
    // fall through to the empty-query error
  }
  if (!query.trim()) {
    return NextResponse.json(
      { error: 'Missing query — send { "query": "<event>" }' },
      { status: 400 },
    );
  }
  return NextResponse.json(resolve(query));
}
