---
name: ludi-pages-search
description: >-
  Search results page: URL-gated results, filters, sort, GameCard grid. Navbar
  submits here. Use when implementing /search or filter/sort UI.
---

# Ludi — search page

Related skills: [ludi-data-search](../ludi-data-search/SKILL.md), [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Routing & gating

| Route | Behavior |
|-------|----------|
| `/search` (no `q`) | **Empty state only** — heading “Type to search”, short hint, optional illustration. **No game cards.** Do not redirect to home. |
| `/search?q={encoded}` | Results page |

**Rationale:** Avoid unsolicited content; empty route is safe and teaches navbar search.

**Default filter when `q` present:** **Main games** quick filter active if user has not chosen another (`quickFilter=main` implied when param absent).

`robots`: `noindex` on `/search` without `q`; with `q`, optional index (default noindex for v1).

---

## Navbar → search flow

Search input lives in **site nav** ([ludi-components-nav](../ludi-components-nav/SKILL.md)), not duplicated as primary UI on this page.

1. User types query on any page.
2. Submit (Enter or search button) → `router.push('/search?q=' + encodeURIComponent(q))`.
3. Search page mounts, reads `q` from URL, fetches via [ludi-data-search](../ludi-data-search/SKILL.md).
4. Page header: **`Results for: “{q}”`** (`h1`).

Optional: repeat a smaller search input below header for refinement (synced to URL).

---

## Layout

```
┌─────────────────────────────────────────────┐
│  Site nav (search field)                     │
├──────────────┬──────────────────────────────┤
│  Filters     │  Results for: "hollow knight" │
│  sidebar     │  [quick filter pills row]      │
│  (md+)       │  sort ▾   count text           │
│              │  ┌────┐ ┌────┐ ┌────┐          │
│              │  │Card│ │Card│ │Card│  grid    │
│              │  └────┘ └────┘ └────┘          │
│              │  [pagination]                   │
└──────────────┴──────────────────────────────┘
```

**Mobile:** filters in slide-over sheet (button “Filters”); quick pills scroll horizontally above grid.

---

## Quick filters (pills)

Single-select or toggle; updates URL `gameTypes` / dedicated `quickFilter` param.

| Pill | Maps to |
|------|---------|
| All | clear type filter (user must select explicitly) |
| Main games | **default when searching** — main game types + `version_parent` null |
| Bundles | bundle types |
| Add-ons & expansions | DLC, expansion, update, etc. |
| Remakes & ports | remake, remaster, port |
| Mods & community | mod, fork |
| Editions | `version_parent != null` (optional) |

Active pill: filled style; sync with sidebar “Content type” when overlapping.

Data mapping: [ludi-data-search](../ludi-data-search/SKILL.md).

---

## Sort control

`<select>` or dropdown near results header.

| Option | Param |
|--------|-------|
| Relevance | `sort=relevance` (default) |
| Rating | `sort=rating` |
| Release date | `sort=release` |
| Name | `sort=name` |
| Critics | `sort=critics` |

Changing sort updates URL and refetches (scroll to top).

---

## Filter sidebar

Accordion sections with **checkbox** lists (multi-select within section).

| Section | Source |
|---------|--------|
| Platforms | cached facets |
| Genres | cached facets |
| Player modes | game_modes (Single-player, Multiplayer, …) |
| Supported languages | language facet (v1 simplified — top languages) |
| Content type | game_types (sync with quick pills) |

**Apply behavior:** updating checkbox immediately updates URL params and refetches (no separate “Apply” v1). Mobile sheet closes on change optional.

**Clear filters** link resets to `?q=` only.

---

## Results grid

- Component: [GameCard](../ludi-components-game-card/SKILL.md) with `showSave={true}`.
- Layout: CSS grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`, gap `gap-4`–`gap-6`.
- Skeleton: 12 card placeholders while loading.
- Empty: **“No games found for ‘{q}’”** + suggest fewer filters.
- Error: inline retry banner.

### Result count

`Showing {n} results` — if IGDB total unknown, show count of returned items + “Load more” or pagination.

### Pagination

URL `page=2`. Controls at bottom: Previous / Next. Disable prev on page 1.

---

## Motion & a11y

- Scroll-reveal on grid (stagger children, Framer Motion) — respect reduced motion.
- Filter sheet: focus trap, ESC close.
- Quick pills: `role="tablist"` or toolbar with `aria-pressed`.
- Announce results count to screen readers on filter change (`aria-live="polite"` region).

---

## SEO & metadata

```ts
title: q ? `Results for “${q}” | Ludi` : 'Search | Ludi'
```

---

## Acceptance criteria

- [ ] `/search` without `q` shows “Type to search” empty state (no cards).
- [ ] New searches default to Main games filter unless URL overrides.
- [ ] Navbar submit lands on `/search?q=…` with header “Results for: …”.
- [ ] GameCard shows cover, title, rating, release date, content type, save.
- [ ] Quick filters update URL and results.
- [ ] Sidebar filters work on desktop; sheet on mobile.
- [ ] Sort changes ordering per data skill.
- [ ] Pagination preserves filters + `q`.
- [ ] Guest save redirects to login.

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | Full page as spec; Enter-only nav search |
| **v1.1** | Typeahead in navbar; language filter hardening |
| **v2** | Saved searches; recent queries |

---

## Resolved

| Topic | Decision |
|-------|----------|
| Empty `/search` | “Type to search” empty state |
| Default filter | Main games |
| Age rating filter | **Removed** for v1 |
| Cards | Extended GameCard with save |
