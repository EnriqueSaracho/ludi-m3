---
name: ludi-data-game
description: >-
  Game page data layer: IGDB queries, ITAD prices, Steam App ID linking,
  normalization, caching, Supabase tables. Use when fetching or caching game
  detail data, Route Handlers, or game page server loaders.
---

# Ludi — game data layer

Related skills: [ludi-pages-game](../ludi-pages-game/SKILL.md) (UI sections), [ludi-components-game-card](../ludi-components-game-card/SKILL.md) (card payload), [ludi-project](../ludi-project/SKILL.md) (stack, auth, env).

## Canonical identity

| Field | Role |
|-------|------|
| `igdb_id` | Primary URL key: `/game/[igdbId]` |
| `slug` | IGDB `games.slug` — SEO-friendly alias later (`/game/hollow-knight` redirect) |
| `steam_appid` | Connector: IGDB `external_games` (steam) → ITAD lookup → RAWG (optional) |

**Route decision (v1):** `/game/[igdbId]` — stable, no slug collision. Store `slug` on normalized record for metadata and future redirects.

## Environment (server-only)

| Variable | Service |
|----------|---------|
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | Twitch OAuth → IGDB Bearer |
| `ITAD_API_KEY` | IsThereAnyDeal |
| `RAWG_API_KEY` | Optional enrichment (v1.1) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cache + community writes (server) |
| `NEXT_PUBLIC_SUPABASE_*` | Auth + RLS reads (client where needed) |

Never expose IGDB/ITAD/RAWG keys to the browser. Fetch in Server Components, Route Handlers, or Server Actions.

---

## IGDB transport

- **Base:** `POST https://api.igdb.com/v4/{endpoint}`
- **Headers:** `Client-ID`, `Authorization: Bearer {token}`, `Accept: application/json`
- **Body:** Apicalypse (`fields …; where …; limit …;`)
- **Expansion:** `cover.image_id`, `videos.*`, `involved_companies.company.name`, etc.
- **Rate limit:** 4 req/s, max 8 concurrent — batch IDs in `where id = (a,b,c);`

### Image URLs

`https://images.igdb.com/igdb/image/upload/t_{size}/{image_id}.jpg`

| Use | Suggested size |
|-----|----------------|
| GameCard / thumbs | `cover_small` |
| Hero cover | `cover_big` |
| Lightbox / screenshots | `1080p` or `screenshot_big` |

---

## Recommended fetch plan (3 IGDB calls + ITAD)

Execute in parallel where possible after resolving `igdb_id` from route.

### Query A — Core game (1 request)

**Endpoint:** `POST /v4/games`

```
where id = {igdbId};
fields
  id, name, slug, summary, storyline,
  first_release_date,
  cover.image_id,
  game_type.name,
  parent_game.id, parent_game.name, parent_game.slug,
  version_parent.id, version_parent.name, version_parent.slug, version_title,
  genres.name, themes.name, platforms.name,
  game_modes.name, player_perspectives.name,
  involved_companies.company.name,
  involved_companies.developer,
  involved_companies.publisher,
  involved_companies.porting,
  involved_companies.supporting,
  franchises.name, franchise.name,
  game_engines.name,
  keywords.name,
  age_ratings.organization.name, age_ratings.rating,
  age_ratings.rating_cover_url, age_ratings.synopsis,
  age_ratings.content_descriptions.category, age_ratings.content_descriptions.description,
  language_supports.language.name,
  language_supports.language_support_type.name,
  websites.url, websites.type,
  external_games.uid, external_games.url,
  external_games.external_game_source.name,
  rating, rating_count,
  aggregated_rating, aggregated_rating_count,
  release_dates.date, release_dates.human,
  release_dates.platform.name, release_dates.region,
  dlcs, expansions, standalone_expansions, expanded_games,
  bundles, ports, remakes, remasters, forks, similar_games,
  videos, screenshots, artworks;
```

Extract `steam_appid` from expanded `external_games` where source is Steam (`uid`).

### Query B — Media detail (1 request, if expansion insufficient)

**Endpoint:** `POST /v4/game_videos` + optional `screenshots` / `artworks`

```
where game = {igdbId};
fields id, name, video_id;
```

```
where game = {igdbId};
fields image_id;
```

**YouTube embed:** `https://www.youtube.com/watch?v={video_id}` or `/embed/{video_id}`.

**Carousel order (normalized):** videos (API order, first = default) → screenshots → artworks. No “trailer” flag on IGDB.

### Query C — Related game cards (1 request)

Collect all unique IDs from: `similar_games`, `dlcs`, `expansions`, `bundles`, `ports`, `remakes`, `remasters`, `standalone_expansions`, `expanded_games`, `forks`, `parent_game`, `version_parent`.

```
where id = ({ids});
fields id, name, slug, cover.image_id, first_release_date, game_type.type,
  rating, aggregated_rating, rating_count, aggregated_rating_count;
limit 50;
```

Split into buckets in application layer by membership in each array from Query A.

### Query D — Time to beat (optional 4th call)

**Endpoint:** `POST /v4/game_time_to_beats`

```
where game_id = {igdbId};
fields hastily, normally, completely, count;
```

Seconds → UI hours/minutes in pages skill.

### Query E — Alternative / localized names (optional, or expand in A)

```
POST /v4/alternative_names — where game = {igdbId}; fields name, comment;
POST /v4/game_localizations — where game = {igdbId}; fields name, region;
```

### Multiplayer detail (optional)

If hero needs platform-specific coop flags:

```
POST /v4/multiplayer_modes — where game = {igdbId};
fields platform.name, campaigncoop, onlinecoop, offlinecoop,
  onlinemax, offlinemax, splitscreen, dropin, lancoop;
```

---

## IGDB gaps

| Feature | Status | v1 workaround |
|---------|--------|----------------|
| Accessibility features | No IGDB endpoint | Hero link to About anchor `#accessibility` with empty state; v1.1 Steam or manual |
| Spin-off of | No explicit relation | Show `franchise` / `franchises`; keywords; omit “spin-off” label |
| Cover trailer | None | First `game_videos` entry |

---

## IsThereAnyDeal

Docs: https://docs.isthereanydeal.com/

### Flow

1. Resolve `steam_appid` from IGDB (required for ITAD PC pricing path).
2. **Lookup:** `GET /games/lookup/v1?appid={steam_appid}` → ITAD `id` (UUID).
3. **Prices:** `POST /games/prices/v3?country={CC}` — body: `["{itadId}"]`
   - `country`: ISO 3166-1 alpha-2 (default `US` until user preference stored).
   - Optional: `deals=true`, `vouchers=true`, `shops=…`
4. **Hero price:** `min(currentPrice)` across returned deals for region; currency from response.
5. **Affiliate:** Preserve full `url` from ITAD — do not strip query params.

### Cache TTL

| Data | TTL | Layer |
|------|-----|--------|
| IGDB core + media | 24h | Next.js `unstable_cache` (primary v1) |
| ITAD prices | 1–6h | `unstable_cache`, shorter revalidate |
| Related card batch | 24h | keyed by parent `igdb_id` |
| ITAD lookup steam→uuid | 7d | rarely changes |

### Cache strategy (decision)

**v1 — Next.js cache only:** `unstable_cache` / `fetch` with `revalidate` keyed by `igdb_id` (+ country for ITAD). No required Supabase writes on page view. Simpler ops, works on Vercel edge/serverless.

**v1.1 — Supabase `game_cache` write-through:** after successful load, upsert normalized JSON for repeat hits, analytics, and future offline search. Search uses separate short-TTL cache (see [ludi-data-search](../ludi-data-search/SKILL.md)).

### Region (prices)

Priority: `profiles.preferred_country` (authed) → cookie `ludi_country` → browser locale/geo hint → fallback `US`. User can override on game page; persist to cookie + profile.

### Console / missing ITAD

Merge store URLs from IGDB `websites` + `external_games` (PlayStation Store, Xbox, Nintendo, Epic, GOG, Steam). ITAD table may be empty; store link row still shown in UI (pages skill).

---

## RAWG (v1.1)

Optional after IGDB load: `GET /games/{rawgId}` or search by `steam_appid` if mapping exists. Use for extra screenshots/ratings only when IGDB sparse. Do not duplicate hero ratings.

---

## Nexus Mods (v1.1)

Not Steam-native. API uses `domainName` (e.g. `skyrim`).

1. `steam_appid` → title from normalized game.
2. Lookup `nexus_game_map` table or Nexus games search.
3. Cache `steam_appid → nexus_domain` in Supabase.
4. Fetch top N mods + link `https://www.nexusmods.com/{domain}/`.

v1: no API call; pages skill shows placeholder.

---

## Normalized types (TypeScript sketch)

Implement in `src/lib/game/types.ts` when coding — names for skill alignment:

```ts
type NormalizedGame = {
  igdbId: number;
  slug: string;
  steamAppid: number | null;
  itadId: string | null;
  name: string;
  summary: string | null;
  storyline: string | null;
  coverImageId: string | null;
  gameType: string | null;
  parentGame: GameRef | null;
  versionParent: GameRef | null;
  versionTitle: string | null;
  media: MediaItem[];
  companies: { developers: string[]; publishers: string[]; porting: string[]; supporting: string[] };
  genres: string[];
  themes: string[];
  platforms: string[];
  gameModes: string[];
  playerPerspectives: string[];
  playerModeSummary: string[]; // derived labels for hero
  languageSummary: { language: string; types: string[] }[];
  ageRatings: AgeRating[];
  primaryAgeRating: AgeRating | null; // region-aware pick
  ratings: {
    igdbUser: number | null;      // 0-100 raw
    critics: number | null;       // 0-100 raw
    ludiUser: number | null;      // 0-10 stored
    composite: number | null;     // 0-10 display
  };
  prices: ItadPriceRow[];
  lowestPrice: { amount: number; currency: string; store: string } | null;
  storeLinks: StoreLink[];
  releases: Release[];
  timeToBeat: { main: number | null; plus: number | null; completionist: number | null } | null;
  related: RelatedBuckets;
  externalIds: Record<string, string>;
};

type GameCardPayload = {
  igdbId: number;
  slug: string;
  name: string;
  coverImageId: string | null;
  compositeRating: number | null; // 0-10
  releaseDate: string | null;      // ISO or display-ready
  contentType: string | null;      // game_type.type label
};
```

`GameCardPayload` extended fields: [ludi-components-game-card](../ludi-components-game-card/SKILL.md). Search and related-card loaders must populate all card fields.

### Rating normalization

| Source | IGDB/raw | UI storage |
|--------|----------|------------|
| IGDB user | `rating` 0–100 | ÷10 → 0–10 |
| Critics | `aggregated_rating` 0–100 | ÷10 → 0–10 |
| Ludi users | DB 0–10 | as-is |

**Composite (hero + card):** mean of defined values among `{igdbUser10, critics10, ludiUser10}`. Do **not** also use `total_rating` when components are present.

```ts
function compositeRating(parts: (number | null)[]): number | null {
  const valid = parts.filter((n): n is number => n != null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
```

Round to 1 decimal for display.

### Primary age rating

Prefer organization matching user region (ESRB for US, PEGI for EU, etc.); fallback first available.

---

## Supabase tables (sketch)

| Table | Purpose |
|-------|---------|
| `profiles` | User display + `preferred_country` (ISO 3166-1 alpha-2) |
| `game_cache` | `igdb_id` PK, `payload jsonb`, `steam_appid`, `fetched_at` |
| `game_ratings` | `user_id`, `igdb_id`, `score` (0–10), `updated_at` — unique (user_id, igdb_id) |
| `game_comments` | `id`, `igdb_id`, `user_id`, `body`, `created_at`, `deleted_at` |
| Lists / library | See [ludi-data-lists](../ludi-data-lists/SKILL.md) — `user_lists`, `list_items`, `user_game_status` |
| `nexus_game_map` | `steam_appid`, `nexus_domain`, `resolved_at` |

**RLS:** users CRUD own lists, ratings, comments; public read on aggregates; `game_cache` service-role write only.

**Ludi rating aggregate:** `avg(score)` from `game_ratings` where `igdb_id` = X — compute in loader or materialized view (v1: query on load).

---

## Server loader shape (pseudocode)

```
loadGamePage(igdbId, countryCode):
  cached = getGameCache(igdbId)
  if stale: parallel [queryA, queryB?, queryD, loadLudiRatings, loadCommentsCount]
  steamAppid = extractSteam(cached)
  itad = steamAppid ? fetchItadPrices(steamAppid, countryCode) : null
  relatedCards = queryC(collectRelatedIds(cached))
  return normalize(cached, itad, relatedCards, ludiRatings)
```

Stream sections with React `Suspense` boundaries per pages skill.

---

## Acceptance criteria (data layer)

- [ ] All IGDB calls server-side with OAuth token refresh cached (~50 min).
- [ ] Game page loads with ≤4 IGDB requests + ≤2 ITAD requests typical case.
- [ ] `steam_appid` extracted and stored on normalized object.
- [ ] ITAD prices respect `country` param and affiliate URLs intact.
- [ ] Composite rating excludes `total_rating` double-count.
- [ ] Related IDs batched in single `games` query.
- [ ] Cache headers/TTLs match table above.
- [ ] 404 when IGDB returns empty for `igdbId`.

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | IGDB A/B/C/D, ITAD, Supabase ratings/comments/lists, `game_cache` |
| **v1.1** | Nexus mods, RAWG, accessibility source, slug redirects |
| **v2** | Webhooks / background refresh for hot games |

---

## Open questions

1. Materialized `game_ratings` avg vs query per page load?
2. Max related IDs per batch (IGDB body size) — cap at 50 and paginate carousels?
