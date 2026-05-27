---
name: ludi-project
description: >-
  Ludi stack, conventions, tokens, motion, a11y, caching. Use when fixing or
  reviewing any area after v1 or onboarding to repo layout and routes.
---

# Ludi — project overview

> **Phase:** v1 shipped. This skill is the **maintenance/onboarding** overview—stack, routes, conventions. Default work: fixes and hardening, not greenfield pages.

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope and cross-cutting decisions.

## Implementation map

| Concern | Location |
|---------|----------|
| Root layout + nav | `src/app/layout.tsx` → `src/components/nav/SiteNav.tsx` |
| Middleware (session refresh, route gates) | `middleware.ts` → `src/lib/supabase/middleware.ts` |
| Design tokens | `src/styles/design-tokens.css`, imported from `src/app/globals.css` |
| Supabase clients | `src/lib/supabase/client.ts`, `server.ts` |
| Env | `src/lib/env.ts`, `.env.example` |
| Schema | `supabase/migrations/001_initial_schema.sql` |
| DB types | `src/types/database.ts` (generated) |

## Product

Ludi aggregates videogame information from multiple sources into one place:

- **Metadata (primary):** IGDB
- **Prices / deals:** IsThereAnyDeal (ITAD)
- **Store presence (future / links):** Steam, PlayStation, Nintendo, Xbox, Epic, GOG

**Canonical connector:** Steam App ID (`steam_appid`) links records across IGDB and ITAD where available.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS v4, `src/styles/design-tokens.css` for colors/fonts/spacing |
| UI | Tailwind + tokens; **shadcn** for dialogs, dropdowns, forms only (not full design-system pass) |
| Motion | Framer Motion (hover, scroll-reveal) |
| Scroll | **Native scroll v1**; Lenis smooth scroll → v1.1 ([ludi-decisions](../ludi-decisions/SKILL.md)) |
| DB / Auth | Supabase (Postgres + Supabase Auth) |
| Caching | Next.js `fetch` cache + `unstable_cache` / Route Handlers; **Supabase `game_cache`** write-through v1 ([ludi-data-game](../ludi-data-game/SKILL.md)) |

## Cross-cutting requirements

- **Responsive:** mobile-first layouts; test sm / md / lg breakpoints.
- **Accessible:** WCAG-minded — semantic HTML, focus states, keyboard nav, `prefers-reduced-motion` (disable heavy Framer motion when set; Lenis deferred v1).
- **Performance:** server-fetch and cache API responses; avoid waterfall on game detail; stale-while-revalidate where appropriate.

## Design tokens

Central file: `src/styles/design-tokens.css` — CSS variables for surfaces, accent, title/body text, radii, fonts. Tailwind theme maps to these variables.

**Visual direction (v1):** minimalist; respect **`prefers-color-scheme`** (light/dark via `color-scheme: light dark`); no theme toggle required v1. Palette sketch in [ludi-decisions](../ludi-decisions/SKILL.md#design-direction-minimal-v1).

## Pages (v1)

- Home
- Search
- Game (detail)
- Profile
- Auth (login, signup, password reset — as needed)

## Components (v1)

- Navigation bar

## Environment

Copy `.env.example` → `.env.local`. Never commit secrets. IGDB Twitch token flow: [ludi-data-game](./ludi-data-game/SKILL.md#twitch-token-client-credentials).

## Auth recommendation

**Supabase Auth** with:

1. **Email + password** for account ownership
2. **OAuth:** **Google** (v1); Discord → v1.1; magic link → v1.1
3. **Session:** `@supabase/ssr` cookie-based sessions in Next.js middleware
4. **Profile data:** `profiles` table keyed to `auth.users.id` (display name, avatar, wishlist refs later)

Avoid rolling custom JWT auth. Row Level Security on user-owned tables from day one.

## Data flow (high level)

```
User → Next.js page
     → Route Handler / Server Action (server-only API keys)
     → IGDB / ITAD
     → normalize by steam_appid → cache layer → UI
```

Supabase stores: user profiles, lists/library, ratings, comments, and **`game_cache`** rows (v1 write-through).

## Region preference

`profiles.preferred_country` (ISO alpha-2) + cookie `ludi_country` → browser locale/geo hint → fallback **`US`** for ITAD. Used for ITAD pricing on game page and future locale features.

## Supabase schema delivery

Iterate schema via **Supabase MCP** (`execute_sql`, `get_advisors`). When stable, add **`supabase/migrations/`** in repo (`supabase migration new` per `.agents/skills/supabase/SKILL.md`). See [ludi-data-lists](../ludi-data-lists/SKILL.md) for table sketch.

## Routes (v1)

| Path | Page |
|------|------|
| `/` | Home |
| `/search` | Search (empty or results) |
| `/game/[igdbId]` | Game detail |
| `/profile` | Profile + list previews |
| `/list/[listId]` | Full list queue |
| `/settings` | Account preferences |
| `/login`, `/signup`, `/forgot-password` | Auth |

## Decisions

Locked v1 scope: [ludi-decisions](../ludi-decisions/SKILL.md).

## Known gaps / deferred

Cross-cutting items not in v1 — see [ludi-decisions § v1.1 backlog](../ludi-decisions/SKILL.md#v11-backlog) (Lenis scroll, theme toggle, slug URLs, navbar typeahead, etc.). Do not duplicate that list here.

| Topic | Notes |
|-------|--------|
| Framer Motion | Listed in stack/decisions; `framer-motion` is in `package.json` but **no `motion` usage in `src/` yet** — page skills still describe intended scroll-reveal |
