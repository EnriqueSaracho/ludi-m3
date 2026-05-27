---
name: ludi-pages-search
description: >-
  Search page UI: empty state, filters, Load more, GameCard grid. Use when
  fixing /search gating, filter URL sync, or results layout.
---

# Ludi — search page

> **Phase:** v1 shipped. Documents **current** `/search` UX. Default work: empty state, Load more, filter sheet—not navbar typeahead ([v1.1](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-data-search](../ludi-data-search/SKILL.md), [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Implementation map

| Concern | Location |
|---------|----------|
| Search route | `src/app/search/page.tsx` |
| Route loading fallback | `src/app/search/loading.tsx` |
| In-page navigation pending | `src/components/search/SearchShell.tsx` (`useTransition` + `navigateSearch`) |
| Client (filters, Load more, grid) | `src/components/search/SearchPageClient.tsx` |
| Filter UI | `src/components/search/SearchFilters.tsx` |
| Skeleton primitives | `src/components/loading/GameCardGridSkeleton.tsx` |
| API | `src/app/api/search/route.ts`, `api/facets/route.ts` |

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
- Skeleton: `GameCardGridSkeleton` (12 cards) while `SearchShell` `isPending` or route `loading.tsx` on cold navigation.
- Empty: **“No games found for ‘{q}’”** + suggest fewer filters.
- Error: inline retry banner.

### Result count

`Showing {n} results` — cumulative count of loaded items (append model). If `hasMore`, show **Load more** button.

### Pagination (Load more v1)

- **No Prev/Next** controls v1.
- **Load more** at grid bottom: disabled when `!hasMore`; on click → increment URL `page` (e.g. `page=2`), fetch next slice, **append** cards to grid (preserve filters + `q`).
- First page: `page=1` or omit (default).
- Shareable URL reflects highest loaded `page`.

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

## Regression checks

- [ ] `/search` without `q` shows “Type to search” empty state (no cards).
- [ ] New searches default to Main games filter unless URL overrides.
- [ ] Navbar submit lands on `/search?q=…` with header “Results for: …”.
- [ ] GameCard shows cover, title, rating, release date, content type, save.
- [ ] Quick filters update URL and results.
- [ ] Sidebar filters work on desktop; sheet on mobile.
- [ ] Sort changes ordering per data skill.
- [ ] **Load more** appends results; preserves filters + `q`.
- [ ] Load more hidden/disabled when `!hasMore`.
- [ ] No Prev/Next controls v1.
- [ ] Guest save redirects to login.

---

## Known gaps / deferred

Navbar typeahead, saved searches → [ludi-decisions § v1.1](../ludi-decisions/SKILL.md#v11-backlog)

---

## Resolved

| Topic | Decision |
|-------|----------|
| Empty `/search` | “Type to search” empty state |
| Default filter | Main games |
| Age rating filter | **Removed** for v1 |
| Cards | Extended GameCard with save |
