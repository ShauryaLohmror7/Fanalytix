# FanalytiX — Event Intelligence

A luxury event-intelligence portal. Ask it for a moment worth watching —
*"What event do you want to witness?"* — and it opens a cinematic, data-honest
arena for that event: live facts, global sentiment, and analytics rendered in
sapphire, gold and liquid glass.

**Arenas** are self-contained experience modules that load on demand. The
first arena is live today:

| Arena | Status | Data |
|---|---|---|
| ⚽ Football — FIFA World Cup 2026 | **Open** | Real fixtures, results, standings via a provider API |
| 🚀 Space (launches, missions) | Detected · provider not connected | — |
| 📈 Markets (IPOs, earnings) | Detected · provider not connected | — |
| 🌍 Geopolitics (situations, summits) | Detected · provider not connected | — |
| 🗳️ Elections (civic signal) | Detected · provider not connected | — |

Queries for unopened domains are still **recognised and routed** — they land
in an honest coming-soon arena, never in fabricated dashboards.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your provider credentials
npm run dev                  # http://localhost:3000
```

Type **"FIFA World Cup 2026"** (or any national team / fixture) into the
portal to enter the football arena. Without provider credentials the arena
still opens — with honest "Connect data provider" states. **FanalytiX never
invents fixtures, scores, or statistics.**

## Environment variables (football arena)

| Variable | Required | Description |
|---|---|---|
| `WORLDCUP_API_BASE_URL` | yes | Provider base URL, e.g. `https://api.football-data.org/v4` |
| `WORLDCUP_API_KEY` | yes | Provider token (sent as `X-Auth-Token`) |
| `WORLDCUP_COMPETITION_CODE` | no | Competition code, defaults to `WC` |

Keys are read **server-side only** (guarded by `server-only`) and never reach
the browser.

## Architecture

```
app/
  page.tsx                     # the portal: landing → transition → arena
  api/events/resolve/          # query → typed EventResolution (with live provider state)
  api/worldcup/*               # football data routes (server-side)
components/
  landing/                     # portal background + text animations
  IntroShader.tsx              # cinematic transition between portal & arenas
  arena/GenericArena.tsx       # honest domain-aware coming-soon shell
  football/                    # ⚽ the Football arena (self-contained module)
    FootballExperience.tsx     #    arena shell (nav, globe, panels, views)
    Ornaments.tsx              #    gold statues & flourishes (football assets)
    views/                     #    matches, teams, sentiment, insights…
lib/
  events/
    types.ts                   # EventDomain, EventArenaConfig, EventResolution, EventTheme
    registry.ts                # one config per domain: matchers, themes, provider notes
    resolveEvent.ts            # pure query → domain resolver (scored matchers)
  worldcupApi.ts               # football provider abstraction (server-only)
  sentiment.ts                 # SIMULATED sentiment engine (clearly badged)
```

### How event resolution works

A query is scored against every domain's `matchers` in
[lib/events/registry.ts](lib/events/registry.ts): most hits wins, ties broken
by domain priority (so *"SpaceX IPO"* is a markets event, *"SpaceX Starship
launch"* a space event). The result is a typed `EventResolution` — domain,
arena to load, availability, provider state, and a human-readable reason.
The same resolver runs client-side on the portal and server-side at
`GET /api/events/resolve?q=…`, where live provider credentials (football's
env keys) are merged in. Unavailable domains open the **GenericArena** — an
honest, domain-voiced coming-soon shell with zero fabricated data.

### Adding an arena

1. Add its `EventArenaConfig` to `lib/events/registry.ts` — matchers,
   examples, theme identity (palette/background/icon/visualization ids),
   provider notes.
2. Build its module under `components/<domain>/` behind a real data
   provider.
3. Flip `available: true` and wire the arena id in `app/page.tsx`.

Each arena scopes its design tokens via `data-theme`, so different events
can wear entirely different luxury looks without touching each other.
(Planned for a later phase: football's `lib/` internals — `worldcupApi`,
`useWorldCupData`, `appState` — move under a `lib/football/` domain folder.)

### Data honesty

Real data or an honest empty state — never reconstructions. Simulated
sentiment is always badged **SIMULATED** wherever it appears.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm start` — serve the production build
