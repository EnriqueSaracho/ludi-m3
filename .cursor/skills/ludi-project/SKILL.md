---
name: ludi-project
description: >-
  Ludi app stack, product vision, cross-cutting conventions (design tokens,
  motion, a11y, caching). Use when implementing any Ludi feature or page.
---

# Ludi — project overview

## Product

Ludi aggregates videogame information from multiple sources into one place:

- **Metadata (primary):** IGDB
- **Prices / deals:** IsThereAnyDeal (ITAD)
- **Enrichment:** RAWG
- **Store presence (future / links):** Steam, PlayStation, Nintendo, Xbox, Epic, GOG

**Canonical connector:** Steam App ID (`steam_appid`) links records across IGDB, ITAD, and RAWG where available.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS v4, `src/styles/design-tokens.css` for colors/fonts/spacing |
| UI (later) | shadcn / Magic UI as needed |
| Motion | Framer Motion (hover, scroll-reveal) |
| Scroll | Lenis smooth scroll |
| DB / Auth | Supabase (Postgres + Supabase Auth) |
| Caching | Next.js `fetch` cache + `unstable_cache` / Route Handlers; optional Supabase tables for normalized game cache |

## Cross-cutting requirements

- **Responsive:** mobile-first layouts; test sm / md / lg breakpoints.
- **Accessible:** WCAG-minded — semantic HTML, focus states, keyboard nav, `prefers-reduced-motion` (disable Lenis + heavy motion when set).
- **Performance:** server-fetch and cache API responses; avoid waterfall on game detail; stale-while-revalidate where appropriate.

## Design tokens

Central file: `src/styles/design-tokens.css` — CSS variables for primary, secondary, accent, title, body text, surfaces, radii, fonts. Tailwind theme maps to these variables (to be wired during UI pass).

## Pages (v1)

- Home
- Search
- Game (detail)
- Profile
- Auth (login, signup, password reset — as needed)

## Components (v1)

- Navigation bar

## Environment

Copy `.env.example` → `.env.local`. Never commit secrets.

## Auth recommendation

**Supabase Auth** with:

1. **Email + password** (or magic link) for account ownership
2. **OAuth** providers users expect: **Google** (low friction), optional **Discord** (gaming audience)
3. **Session:** `@supabase/ssr` cookie-based sessions in Next.js middleware
4. **Profile data:** `profiles` table keyed to `auth.users.id` (display name, avatar, wishlist refs later)

Avoid rolling custom JWT auth. Row Level Security on user-owned tables from day one.

## Data flow (high level)

```
User → Next.js page
     → Route Handler / Server Action (server-only API keys)
     → IGDB / ITAD / RAWG
     → normalize by steam_appid → cache layer → UI
```

Supabase stores: user profiles, saved games / wishlists (later), and optional **game_cache** rows to cut repeat external API calls.

## Region preference

`profiles.preferred_country` (ISO alpha-2) + cookie `ludi_country`. Browser/geo hint when unset. Used for ITAD pricing on game page and future locale features.

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

## Status

Specs under `.cursor/skills/` for home, game, search, auth, profile, lists. Implementation not started.
