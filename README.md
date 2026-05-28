# Ludi

Ludi aggregates videogame metadata, pricing, and personal library tools in one place. v1 focuses on discovery, game detail, lists, and profiles backed by IGDB and IsThereAnyDeal (ITAD), with user data in Supabase.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), TypeScript, React 19 |
| Styling | Tailwind CSS v4, design tokens in `src/styles/design-tokens.css` |
| UI | Tailwind + tokens; [shadcn/ui](https://ui.shadcn.com) for dialogs, dropdowns, forms |
| Database / Auth | [Supabase](https://supabase.com) (Postgres + Supabase Auth) |
| Game metadata | [IGDB](https://api-docs.igdb.com/) (Twitch client credentials) |
| Prices / deals | [IsThereAnyDeal](https://docs.isthereanydeal.com/) |

**Canonical link across sources:** Steam App ID (`steam_appid`) where available.

## Prerequisites

- Node.js 20+
- npm (or pnpm / yarn)
- A Supabase project
- IGDB (Twitch) API credentials
- ITAD API key

## Getting started

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd ludi-m3
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and fill in values. Never commit secrets.

   | Variable | Purpose |
   |----------|---------|
   | `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` | Server-only IGDB access |
   | `ITAD_API_KEY` | Server-only pricing and deals |
   | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client and server Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations |

3. **Database**

   Apply migrations from `supabase/migrations/` to your Supabase project (CLI or dashboard). Regenerate types in `src/types/database.ts` when the schema changes.

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The default dev script uses webpack; use `npm run dev:turbo` for Turbopack.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (webpack) |
| `npm run dev:turbo` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run generate:game-types` | Regenerate game type ID helpers |

## Routes (v1)

| Path | Description |
|------|-------------|
| `/` | Home — discovery and library rows |
| `/search` | Game search with filters |
| `/game/[igdbId]` | Game detail |
| `/profile` | Profile and list previews |
| `/list/[listId]` | Full list queue |
| `/settings` | Account preferences |
| `/login`, `/signup`, `/forgot-password` | Auth flows |

## Project layout

```
src/
  app/              # App Router pages and API routes
  components/       # UI (nav, game cards, lists, etc.)
  lib/              # Supabase clients, env, data loaders
  styles/           # Global CSS and design tokens
  types/            # TypeScript types (incl. generated DB types)
middleware.ts       # Session refresh and route protection
supabase/migrations # SQL schema migrations
```

Agent and contributor context: see `.cursor/skills/` (e.g. `ludi-project`, `ludi-decisions`) for scope, conventions, and data-flow notes.

## Data flow (high level)

```
Browser → Next.js (RSC / Server Actions / Route Handlers)
       → IGDB / ITAD (server-only API keys)
       → normalize + cache → UI
       → Supabase (profiles, lists, ratings, game_cache)
```

API keys stay on the server. User-owned tables use Row Level Security in Supabase.

## License

Private project — see repository settings for distribution terms.
