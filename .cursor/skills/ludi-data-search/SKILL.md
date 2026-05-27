---
name: ludi-data-search
description: >-
  Search data: IGDB query build, filters, sort, Load more, facets, cache.
  Use when fixing search API, pagination, facets, or GameCard result mapping.
---

# Ludi — search data layer

> **Phase:** v1 shipped. Documents **current** search API behavior. Default work: query bugs, `hasMore`, filters, facet cache—not navbar typeahead ([v1.1](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-pages-search](../ludi-pages-search/SKILL.md), [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-data-game](../ludi-data-game/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Implementation map

| Concern | Location |
|---------|----------|
| Search API route | `src/app/api/search/route.ts` |
| Facets API route | `src/app/api/facets/route.ts` |
| Query builder + search execution | `src/lib/search/build-query.ts`, `search-games.ts` |
| Facet lists | `src/lib/igdb/facets.ts` |
| Game type IDs | `src/lib/igdb/game-type-ids.json` |
| IGDB transport | `src/lib/igdb/client.ts` |
| Search page UI | `src/app/search/page.tsx`, `src/components/search/*` |

## IGDB search mechanics

Docs: https://api-docs.igdb.com/#search

| Rule | Detail |
|------|--------|
| Endpoint | `POST /v4/games` |
| Syntax | `search "{query}";` in body |
| Default order | **Similarity to search string** (relevance) |
| Combine | `search` + `fields` + `where` + `sort` + `limit` + `offset` |
| Default limit | 10; **max 500** |
| Rate limit | 4 req/s — debounce client navbar; cache responses |

### Example bodies

**Baseline search:**

```
search "hollow knight";
fields id, name, slug, cover.image_id, first_release_date,
  game_type.type, rating, aggregated_rating, rating_count, aggregated_rating_count;
limit 50;
```

**Search + main games only (quick filter):**

```
search "assassin";
fields id, name, slug, cover.image_id, first_release_date, game_type.type,
  rating, aggregated_rating;
where game_type = {0} & version_parent = null;
limit 50;
```

Note: `game_type` uses **reference IDs** from `/v4/game_types`, not deprecated `category` enum values. Cache `game_types` list at build or daily revalidate.

**Search + platform filter:**

```
search "zelda";
fields id, name, slug, cover.image_id, first_release_date, game_type.type,
  rating, aggregated_rating;
where platforms = {130, 48};
sort first_release_date desc;
limit 50; offset 0;
```

**Search + genre (array field):**

```
where genres = (12,31);
```

**Search + sort by rating:**

```
sort rating desc;
where rating != null;
```

When user picks non-relevance sort, append `sort` **after** search — IGDB applies both; relevance may be deprioritized (acceptable for explicit user sort).

### Tag-based filtering (advanced)

For heavy genre/theme filters IGDB supports `where tags = (computedTagNumber);` — optional v1.1 optimization. v1: use `genres = (ids)` and `platforms = {ids}` directly.

---

## Quick filter → IGDB `game_type`

Map Ludi quick filters to `where game_type = {…}` using IDs from cached `game_types` (fetch once: `fields id, type; limit 50;`).

| Quick filter | `game_type.type` strings (match IDs at runtime) |
|--------------|--------------------------------------------------|
| **All** | no `game_type` clause — only when user selects All |
| **Main games** | **Default for every search with `q`** — Main Game + `where version_parent = null` |
| **Bundles** | Bundle |
| **Add-ons & expansions** | DLC, Addon, Expansion, Standalone Expansion, Update, Pack, Episode, Season |
| **Remakes & ports** | Remake, Remaster, Port |
| **Mods & community** | Mod, Fork |
| **Editions** (optional pill) | filter `version_parent != null` OR types tied to editions |

Deprecated `category` enum (0=main_game, 1=dlc, …) still appears in old examples — **prefer `game_type`** for new code.

### Quick filter ID cache

**v1:** Committed **`src/lib/igdb/game-type-ids.json`** from one-time IGDB `/v4/game_types` fetch (see [game-type-ids.json](#game-type-idsjson) below). Do not use deprecated `category` enum for new code.

Example mapping (verify against live `game_types` when generating):

| type | Typical label |
|------|----------------|
| main_game | Main Game |
| dlc_addon | DLC / Add-on |
| expansion | Expansion |
| bundle | Bundle |
| mod | Mod |
| port | Port |
| remake / remaster | Remake, Remaster |

---

## Sidebar filters → `where` clauses

Build `where` from URL search params (AND logic between groups, OR within multi-select checkbox group).

| Filter UI | IGDB approach | Notes |
|-----------|---------------|-------|
| Platforms | `platforms = {id,…}` | Facet list from `/v4/platforms` cached |
| Genres | `genres = (id,…)` | `/v4/genres` cached |
| Player modes | `game_modes = (id,…)` | Single-player, Multiplayer, Co-op, etc. |
| Languages | `language_supports.language = X` | Tricky — may need `where language_supports = (support_row_ids)` or post-filter v1 |
| Content type | same as quick filters | `game_type` IDs |

**Number of players:** map UI to `game_modes` + optional `multiplayer_modes` post-filter (IGDB has no “player count” integer). Labels: Single-player, Multiplayer, Co-op online/offline from `game_modes.name`.

**Languages filter v1:** if IGDB where too heavy, fetch `language_supports` for result set batch (v1.1) or filter top 50 client-side (document as limitation).

---

## Sort options

| UI label | IGDB `sort` |
|----------|-------------|
| Relevance (default) | omit `sort` (search default) |
| Rating | `sort rating desc` + `where rating != null` |
| Release date | `sort first_release_date desc` |
| Name A–Z | `sort name asc` |
| Critics score | `sort aggregated_rating desc` |

Expose in URL: `?q=…&sort=rating&order=desc`.

---

## URL contract

```
/search?q={query}&sort={sortKey}&page={n}
  &platforms=48,6
  &genres=12,31
  &gameTypes=0,3
  &gameModes=1,2
  &languages=…
  &quickFilter=main|all|bundles|…
```

- **`q` required** — page must not render results without it (see pages skill).
- **`page`** → `offset = (page-1) * limit`, default `limit=24`, default `pageSize=24`.
- Invalid IDs stripped server-side.

### Load more (v1)

- UI increments `page` and **appends** items ([ludi-pages-search](../ludi-pages-search/SKILL.md)).
- Server requests `limit+1` rows internally; returns `pageSize` items + **`hasMore: boolean`** (do not return the extra row to client).

---

## game-type-ids.json

| Step | Detail |
|------|--------|
| Script | `scripts/generate-game-type-ids.ts` — fetch `/v4/game_types`, write JSON |
| Output | `src/lib/igdb/game-type-ids.json` — map keys (`main`, `dlc`, `mod`, …) → IGDB type ids |
| Commit | Check in generated file; re-run script when IGDB adds types |
| v1.1 | Optional daily revalidate job |

---

## Normalized result

```ts
type SearchResult = {
  query: string;
  page: number;
  pageSize: number;
  items: GameCardPayload[];
  hasMore: boolean;      // true when IGDB returned limit+1 rows
  facetsApplied: FilterState;
};
```

Map each IGDB game to [GameCardPayload](../ludi-components-game-card/SKILL.md):

| Card field | IGDB |
|------------|------|
| `releaseDate` | `first_release_date` → format with `Intl` |
| `contentType` | `game_type.type` |
| `compositeRating` | same formula as game page |

Optional: batch-load Ludi `game_ratings` avg for visible ids (v1.1).

---

## Facet metadata (cached)

Load once, `revalidate: 86400`:

| Endpoint | Use |
|----------|-----|
| `/v4/platforms` | `fields id, name, platform_type` — filter consumer-facing |
| `/v4/genres` | `fields id, name` |
| `/v4/game_modes` | `fields id, name` |
| `/v4/game_types` | quick filter + content type |
Store JSON in `src/lib/igdb/facets/` or fetch in Route Handler `GET /api/facets`.

**Age rating filter:** not in v1 (removed from product scope).

---

## Caching

| Key | TTL | Notes |
|-----|-----|-------|
| `search:{hash(q+filters+sort+page)}` | 5–15 min | `unstable_cache` |
| Facets | 24h | static |
| `game_types` ids | committed JSON | regenerate via script when needed |

Do not cache empty `q`. Hash full query string including filters.

**No Supabase for search v1** — Next.js cache sufficient.

---

## Server API shape

```
GET /api/search?q=&sort=&page=&platforms=…
  → buildApicalypseBody()
  → igdbFetch()
  → normalize to SearchResult
```

Navbar uses same endpoint or Server Action after navigation to `/search?…`.

Debounce: **300ms** minimum on typeahead if added later; v1 navbar submits on Enter only.

---

## Mature / unwanted content

IGDB search has no simple “safe search” flag. Mitigations:

1. **Never call search without `q`** (product rule).
2. Optional v1.1: exclude `game_modes` / themes tags known for adult visual novels — maintain blocklist ids.
3. ITAD `mature` flag when enriching prices (search v1.1).

---

## Regression checks

- [ ] IGDB query built from `q` + filters + sort + pagination.
- [ ] Quick filters map to correct `game_type` IDs.
- [ ] Results map to full `GameCardPayload`.
- [ ] Cache keyed by full param set.
- [ ] Facet endpoints cached 24h.
- [ ] Respects 4 req/s (no duplicate in-flight per session).
- [ ] `hasMore` from `limit+1` fetch drives Load more visibility.
- [ ] Quick filters use `game-type-ids.json`.

---

## Known gaps / deferred

Navbar typeahead, language filter server-side, Ludi rating in sort → [ludi-decisions § v1.1](../ludi-decisions/SKILL.md#v11-backlog)

---

## Resolved

| Topic | Decision |
|-------|----------|
| `hasMore` | **`limit+1`** server-side; Load more UX ([ludi-decisions](../ludi-decisions/SKILL.md)) |
| “All” quick filter | Does **not** auto-add `version_parent = null`; Main games remains default when `q` present |
