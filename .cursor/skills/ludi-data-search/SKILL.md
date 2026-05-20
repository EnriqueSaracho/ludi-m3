---
name: ludi-data-search
description: >-
  Search data layer: IGDB search query building, filters, sort, pagination,
  facet lists, cache. Use when implementing /search, navbar search API, or
  GameCard result payloads.
---

# Ludi — search data layer

Related skills: [ludi-pages-search](../ludi-pages-search/SKILL.md), [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-data-game](../ludi-data-game/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

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

Store in `src/lib/igdb/game-type-ids.ts` generated at build from API or hardcoded after one-time fetch. Example mapping from deprecated category (verify against live `game_types`):

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
- **`page`** → `offset = (page-1) * limit`, default `limit=24`.
- Invalid IDs stripped server-side.

---

## Normalized result

```ts
type SearchResult = {
  query: string;
  total?: number;        // IGDB may not give total — use "hasMore" via limit+1 fetch optional
  page: number;
  pageSize: number;
  items: GameCardPayload[];
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
| `game_types` ids | 7d | rare changes |

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

## Acceptance criteria

- [ ] IGDB query built from `q` + filters + sort + pagination.
- [ ] Quick filters map to correct `game_type` IDs.
- [ ] Results map to full `GameCardPayload`.
- [ ] Cache keyed by full param set.
- [ ] Facet endpoints cached 24h.
- [ ] Respects 4 req/s (no duplicate in-flight per session).

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | IGDB search + platform/genre/game_type/game_mode filters + sort + pagination |
| **v1.1** | Language filter server-side, tag optimization, Ludi rating in sort |
| **v2** | Typeahead suggestions, search history |

---

## Open questions

1. Fetch `limit+1` to detect `hasMore` without count endpoint?
2. Include `version_parent = null` on “All” quick filter too (edition noise)?
