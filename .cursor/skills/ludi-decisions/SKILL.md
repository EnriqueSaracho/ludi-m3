---
name: ludi-decisions
description: >-
  Locked Ludi v1 scope and cross-cutting decisions. Read first before fixes or
  extensions. Use when checking scope, v1 vs v1.1, or resolving spec conflicts.
---

# Ludi — locked v1 decisions

> **Phase:** v1 scope is **delivered**. The table below is the product contract—do not re-litigate shipped scope unless the user asks. Not-yet-built product items live only in [v1.1 backlog](#v11-backlog).

**Source of truth** for v1 scope. Other skills link here instead of repeating the full table.

Related: [ludi-project](../ludi-project/SKILL.md) (stack, routes), area skills below.

---

## Status

| Item | State |
|------|--------|
| v1 scope (table below) | **Shipped** — routes and features exist in `src/app/`, `src/lib/`, `supabase/migrations/001_initial_schema.sql` |
| Agent default work | Cleanup, bug fixes, polish, hardening while testing |
| Deferred product | [v1.1 backlog](#v11-backlog) only—do not expand scope without user direction |
| Spec vs code | Area skills document **as-built** behavior; if they disagree with this table, **flag the user** before changing locked decisions |

---

## Locked v1 scope

| ID | Decision |
|----|----------|
| **Scope** | **Full v1** per [ludi-project](../ludi-project/SKILL.md) routes — home, search, game, profile, list, settings, auth. No lean MVP carve-out. |
| **Game page** | All **6 sections** in v1: hero, where to buy, about, community, related, what's next. |
| **Community** | **In v1**: plain-text comments + user ratings (0–10 slider). |
| **Lists** | **Full v1**: system lists, custom lists, play status, AddToListMenu, profile previews, `/list/[listId]` with reorder. |
| **Auth methods** | **Email + password + Google OAuth** (no Discord/magic link in v1). |
| **Post-signup redirect** | Default `next` after signup → **`/profile`** (login default remains `/` unless `next` param). |
| **Username** | **Derived from email prefix** on signup; **uniqueness not enforced in v1** (DB unique → v1.1). |
| **Email verification** | **Required before comment or rate** — gate UI and server actions; check Supabase `email_confirmed_at`. |
| **Terms** | **Minimal v1**: single line on signup — “By creating an account you agree to our Terms and Privacy Policy” with `/terms` and `/privacy` links; **no required checkbox**. Login does not repeat unless legally needed. |
| **`game_cache`** | **In v1**: Supabase table + server write-through after successful game load; TTL 24h (see [ludi-data-game](../ludi-data-game/SKILL.md)). |
| **Ludi rating aggregate** | **In v1 on game page**: `avg(game_ratings.score)` via **query on load** (materialized view → v1.1). |
| **Related IDs batch** | **Cap at 50** per IGDB batch; overflow truncate or v1.1 carousel pagination. |
| **Search pagination** | **“Load more”** button; URL `page` param; **append** results (no infinite scroll, no Prev/Next v1). |
| **Home discovery cache** | **`unstable_cache` / revalidate: 24 hours** for New releases + Top rated IGDB slices. |
| **ITAD default country** | If unknown: **`US` fallback**, after `profiles.preferred_country` → cookie `ludi_country` → browser locale/geo hint. |
| **UI** | **Tailwind v4 + `design-tokens.css`**; **shadcn** only where it clearly helps (dialogs, dropdowns, forms). |
| **Visual direction** | **Minimalist**; **respect `prefers-color-scheme`** (light/dark); no forced theme toggle v1. |
| **Lenis** | **Deferred** — native scroll v1; Lenis site-wide → v1.1. |
| **Game sticky section nav** | **Required in v1** (Buy · About · Community · Related · Next). |
| **Rating slider** | **0–10 scale, step 0.5** (DB stores 0–10). |
| **Nav** | **Show username next to avatar on desktop** (`md+`). |
| **List reorder mobile** | **Long-press to drag** on touch; desktop drag as specced. |
| **Supabase schema** | Iterate via **Supabase MCP** (`execute_sql`, `get_advisors`); commit **`supabase/migrations/`** when stable. |
| **Avatars** | **v1**: Storage bucket `avatars`, upload on profile, max 2MB jpg/png/webp. |
| **`game_types` IDs** | Committed **`src/lib/igdb/game-type-ids.json`** + generation script (see [ludi-data-search](../ludi-data-search/SKILL.md)). |

---

## Assumptions (implementation detail)

| Topic | Assumption |
|-------|------------|
| Search Load more | URL param **`page`**; default `pageSize=24`. Button increments `page`; client **appends** cards. |
| `hasMore` | Server fetches **`limit+1`** internally; returns `pageSize` items + `hasMore: boolean`. |
| `game_cache` TTL | **24h** stale; read fresh row before IGDB; upsert after successful normalize. |
| Signup username | **No username field** on signup; derive from email local-part → sanitize `[a-zA-Z0-9_]{3,24}`. |
| Profile username edit | Inline edit on `/profile` allowed; 3–24 chars; **no unique constraint** v1. |
| Theme | `design-tokens.css` + **`color-scheme: light dark`**; no theme toggle v1. |
| Schema workflow | MCP iterate → `supabase migration new` when stable (see `.agents/skills/supabase/SKILL.md`). |
| Search “All” filter | Main games remains default when `q` present; “All” does not auto-add `version_parent = null`. |
| GameCard rating badge | **Numeric pill** (e.g. `8.4`), no star icon v1. |

---

## Design direction (minimal v1)

Proposed tokens in `src/styles/design-tokens.css`:

| Token | Role |
|-------|------|
| `--surface` / `--surface-elevated` | Neutral backgrounds (light/dark via `prefers-color-scheme`) |
| `--text-title` / `--text-body` | High contrast, restrained hierarchy |
| `--accent` | Single restrained accent (links, primary buttons) |
| `--radius-md` | Moderate rounding; avoid heavy glassmorphism |

System font stack or one variable font; no decorative clutter. Framer Motion: subtle scroll-reveal only; respect `prefers-reduced-motion`.

---

## v1.1 backlog

- Lenis smooth scroll site-wide
- `profiles.username` UNIQUE at DB level
- Materialized / cached `game_ratings` aggregate
- Magic link, Discord OAuth
- Navbar search typeahead
- ITAD deals row on home
- Slug URLs `/game/[slug]`
- Synced “recently visited” to Supabase
- Optional theme toggle
- `game_cache` analytics / background refresh
- Profile inline list rename
- GameCard lowest price chip, platform icons
- Search: language filter server-side, Ludi rating in sort
- Home: platform quick-filter chips, personalized rows

---

## Area skills

| Area | Skill |
|------|--------|
| Stack, routes, tokens | [ludi-project](../ludi-project/SKILL.md) |
| Auth, verification | [ludi-auth](../ludi-auth/SKILL.md) |
| IGDB, ITAD, cache | [ludi-data-game](../ludi-data-game/SKILL.md) |
| Search | [ludi-data-search](../ludi-data-search/SKILL.md) |
| Lists, schema | [ludi-data-lists](../ludi-data-lists/SKILL.md) |
| Pages | `ludi-pages-*` |
| Components | `ludi-components-*` |
