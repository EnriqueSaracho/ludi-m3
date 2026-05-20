---
name: ludi-pages-home
description: >-
  Home page layout: hero, personalized rows, discovery sections. No unsolicited
  game grids. Use when implementing / or landing experience.
---

# Ludi — home page

Related skills: [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-pages-search](../ludi-pages-search/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-data-lists](../ludi-data-lists/SKILL.md), [ludi-data-game](../ludi-data-game/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Purpose

Welcoming entry point that **does not** dump an unfiltered game catalog (same principle as search gating). Surfaces **intent-driven** entry (search), **personal** continuity (lists, recent), and **light discovery** (curated IGDB slices).

Route: `/`

---

## Layout (top → bottom)

### 1. Hero

| Element | Spec |
|---------|------|
| Headline | Product value, e.g. “Every game. Every store. One place.” (tone: clear, not marketing fluff) |
| Subcopy | One line on prices, lists, and metadata |
| Search CTA | Large duplicate of nav search — same submit rules → `/search?q=…` |
| Background | Subtle gradient / artwork from design tokens; optional muted IGDB artwork rotate (v1.1) |

No game cards in hero.

### 2. Continue / your library (authed only)

If session exists, fetch system lists preview ([ludi-data-lists](../ludi-data-lists/SKILL.md)):

| Row | Source list | Max cards |
|-----|-------------|-----------|
| **Continue playing** | `currently_playing` | 6 |
| **Want to play** | `want_to_play` | 6 |

Each row: section title + horizontal GameCard scroll + “See all” → `/list/{id}`.

**Guest:** replace with single card CTA: “Sign in to track games and build lists” → `/login?next=/`.

### 3. Recently visited (everyone)

- Source: `localStorage` `ludi_recent_games` (same as game page).
- Title: “Recently viewed”.
- Up to 8 cards, horizontal scroll.
- Hidden if empty.

### 4. Discover — new releases

- IGDB: games with `first_release_date` in last 90 days, `game_type` = main, `version_parent = null`, `sort first_release_date desc`, `limit 12`.
- Title: “New releases”.
- GameCard grid (2–4 cols responsive).
- “Browse more” → `/search?q=new+releases` **not used** — instead link to search with pre-filled filter v1.1; v1 link text “Explore search” → `/search` empty state.

Better v1: “See more” runs search with hidden filter via `/search?q=*&filter=new` — **skip**; use static IGDB fetch only on home.

### 5. Discover — highly rated

- IGDB: `where rating != null & rating_count > 5`; `sort rating desc`; `limit 12`; main games only.
- Title: “Top rated”.
- Same grid pattern.

### 6. Discover — deals teaser (optional v1.1)

- ITAD featured deals — requires region cookie.
- Title: “Deals worth a look”.
- v1: omit section.

### 7. Footer CTA (guest)

Repeat sign-up value prop + buttons Login / Sign up.

---

## What we intentionally omit

| Omit | Why |
|------|-----|
| Infinite browse grid | Avoids unsolicited / adult surfacing |
| Random popular without filters | Same |
| User-generated content feed | v2 |

---

## Data loading

| Section | Where |
|---------|--------|
| Hero | static |
| Library rows | Supabase + IGDB card batch |
| Recent | client localStorage |
| New / Top rated | server IGDB, `unstable_cache` 6h |

Parallelize IGDB calls (max 2) to respect rate limits.

---

## Motion & a11y

- Hero text scroll-reveal; cards stagger in per row.
- Horizontal rows: keyboard-scrollable container.
- `h1` once in hero; section `h2`s.

---

## SEO

`title: Ludi — find games, prices, and deals`
`description`: one sentence product summary.

---

## Acceptance criteria

- [ ] `/` never shows unfiltered “all games” grid.
- [ ] Hero search matches navbar behavior.
- [ ] Authed users see continue / want-to-play previews.
- [ ] Guests see sign-in CTA instead of library rows.
- [ ] Recently viewed from localStorage when present.
- [ ] New releases + top rated rows use main-game IGDB filters.
- [ ] GameCards link to `/game/[igdbId]`.

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | Hero, library previews, recent, 2 discovery rows |
| **v1.1** | ITAD deals row, personalized “Because you played X” |
| **v2** | Editorial collections |

---

## Open questions

1. Cache TTL for discovery rows — 6h vs 24h?
2. Show platform quick-filter chips on home (Steam, PS, Xbox)?
