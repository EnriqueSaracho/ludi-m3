---
name: ludi-data-game
description: >-
  Game data: IGDB, ITAD, normalize, game_cache, ratings/comments loaders.
  Use when debugging game page fetch, cache TTL, ITAD pricing, or related batches.
---

# Ludi — game data layer

> **Phase:** v1 shipped. Documents **current** loaders and cache rules. Default work: fix fetch failures, cache, ratings, ITAD country—not new IGDB surfaces unless scoped.

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-pages-game](../ludi-pages-game/SKILL.md) (UI sections), [ludi-components-game-card](../ludi-components-game-card/SKILL.md) (card payload), [ludi-project](../ludi-project/SKILL.md) (stack, auth, env).

## Implementation map

| Concern | Location |
|---------|----------|
| Server loader (IGDB + cache + ITAD + community) | `src/lib/game/load-game-page.ts` |
| Normalize + Steam id + card payloads | `src/lib/game/normalize.ts` |
| Types + play status | `src/lib/game/types.ts` |
| Composite rating math | `src/lib/game/composite-rating.ts` |
| Recent games (localStorage) | `src/lib/game/recent-games.ts` |
| IGDB client + token | `src/lib/igdb/client.ts`, `src/lib/igdb/auth.ts`, `images.ts` |
| ITAD | `src/lib/itad/client.ts` |
| Country for ITAD | `src/lib/country/resolve-country.ts` |
| Game page (server) | `src/app/game/[igdbId]/page.tsx` |
| Game page (client sections) | `src/components/game/GamePageClient.tsx` |

## Canonical identity

| Field | Role |
|-------|------|
| `igdb_id` | Primary URL key: `/game/[igdbId]` |
| `slug` | IGDB `games.slug` — SEO-friendly alias later (`/game/hollow-knight` redirect) |
| `steam_appid` | Connector: IGDB `external_games` (steam) → ITAD lookup |

**Route decision (v1):** `/game/[igdbId]` — stable, no slug collision. Store `slug` on normalized record for metadata and future redirects.

## Environment (server-only)

| Variable | Service |
|----------|---------|
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | Twitch OAuth → IGDB Bearer |
| `ITAD_API_KEY` | IsThereAnyDeal |
| `SUPABASE_SERVICE_ROLE_KEY` | Cache + community writes (server) |
| `NEXT_PUBLIC_SUPABASE_*` | Auth + RLS reads (client where needed) |

Never expose IGDB/ITAD keys to the browser. Fetch in Server Components, Route Handlers, or Server Actions.

See **Twitch token (client credentials)** below for how `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` become Bearer tokens.

### Twitch token (client credentials)

`IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` are **Twitch Developer** app credentials — not end-user login. The server exchanges them for a Bearer token on every IGDB API surface (game page, search, facets). This flow is **separate from Supabase Auth**.

| Step | Detail |
|------|--------|
| Request | `POST https://id.twitch.tv/oauth2/token` with `client_id`, `client_secret`, `grant_type=client_credentials` |
| Response | `access_token`; `expires_in` when present |
| Docs | [IGDB authentication](https://api-docs.igdb.com/#authentication) |

**Where it runs:** Server Components, Route Handlers, Server Actions only. Never `NEXT_PUBLIC_*` for IGDB; never send credentials or tokens to the browser.

**Module (shipped):** `src/lib/igdb/auth.ts` + `src/lib/igdb/client.ts`. [ludi-data-search](../ludi-data-search/SKILL.md) uses the same client; do not duplicate token logic.

**Caching / refresh:**

- Cache `access_token` in memory (module-level) or `unstable_cache` for ~50 minutes, or `expires_in` minus a safety buffer when Twitch returns it.
- On IGDB **401** or token errors: fetch a new token once, then retry the failed request.
- IGDB app tokens may not expire today; still refresh defensively.
- **Client secret** is long-lived — no scheduled rotation. Regenerate in Twitch Console only if leaked or rotated manually.

**IGDB calls:** Use headers from [IGDB transport](#igdb-transport) — `Client-ID: {IGDB_CLIENT_ID}` and `Authorization: Bearer {access_token}`.

**Env files:** `.env.example` documents names, docs links, and server-only scope only; token behavior lives here and in `src/lib/igdb/`.

```ts
// Minimal token fetch (server-only)
await fetch(
  `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
  { method: "POST" },
);
```

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
  game_type.type,
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

### Cache strategy (v1)

**Dual layer:**

1. **Supabase `game_cache`** — read on game load if `fetched_at` within **24h**; else fetch IGDB/ITAD, normalize, **upsert** write-through (service role). See [game_cache (v1)](#game_cache-v1) below.
2. **Next.js** — `unstable_cache` / `fetch` `revalidate` keyed by `igdb_id` (+ country for ITAD) as additional layer.

Search uses separate short-TTL Next cache only ([ludi-data-search](../ludi-data-search/SKILL.md)).

### Region (prices)

Priority: `profiles.preferred_country` (authed) → cookie `ludi_country` → browser locale/geo hint → fallback `US`. User can override on game page; persist to cookie + profile.

### Console / missing ITAD

Merge store URLs from IGDB `websites` + `external_games` (PlayStation Store, Xbox, Nintendo, Epic, GOG, Steam). ITAD table may be empty; store link row still shown in UI (pages skill).

---

## Mods (IGDB)

There is **no** `mods` field on `/v4/games`. Mod entries are separate games with `game_type` = Mod (see [ludi-data-search](../ludi-data-search/SKILL.md) “Mods & community”), often linked via `parent_game`.

| Step | Detail |
|------|--------|
| Query A | Do **not** request `mods` — IGDB returns 400. |
| Optional Query F | `where parent_game = {igdbId} & game_type = ({ids from `src/lib/igdb/game-type-ids.json` → `mod`});` then card fields like Query C. |
| Normalize | Bucket into `related.mods: GameCardPayload[]` from Query F results; until implemented, return `mods: []`. |

**v1 (shipped):** `related.mods` is always empty; game page shows Nexus link only ([ludi-pages-game](../ludi-pages-game/SKILL.md)). IGDB mods carousel = optional follow-up (Query F).

**Nexus:** Not a data source. Pages skill may link to Nexus site search by game `name` only (static URL, no server call). Do **not** add `nexus_game_map` or any Nexus-related Supabase table.

---

## Normalized types (TypeScript sketch)

Types live in `src/lib/game/types.ts` — names for skill alignment:

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

type RelatedBuckets = {
  similar: GameCardPayload[];
  dlcs: GameCardPayload[];
  expansions: GameCardPayload[];
  standaloneExpansions: GameCardPayload[];
  bundles: GameCardPayload[];
  ports: GameCardPayload[];
  remakes: GameCardPayload[];
  remasters: GameCardPayload[];
  expandedGames: GameCardPayload[];
  forks: GameCardPayload[];
  mods: GameCardPayload[];
  parentGame: GameCardPayload | null;
  versionParent: GameCardPayload | null;
  // other buckets per Query A arrays as implemented
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

**RLS:** users CRUD own lists, ratings, comments; public read on aggregates; `game_cache` service-role write only.

**Ludi rating aggregate (v1):** `SELECT avg(score)` from `game_ratings` where `igdb_id` = X on each game page load. Materialized view → v1.1.

---

## game_cache (v1)

| Column | Type | Notes |
|--------|------|-------|
| `igdb_id` | integer PK | |
| `payload` | jsonb | Normalized game JSON |
| `steam_appid` | integer nullable | Index for ITAD |
| `fetched_at` | timestamptz | Stale after **24h** |

- **Read:** If row exists and fresh → hydrate loader from `payload`; skip IGDB A/B/C/D when complete.
- **Write:** After successful normalize, upsert via **service role** (RLS: no public write).
- **Miss/stale:** Full IGDB fetch plan, then upsert.

---

## Related ID batching (v1)

- Collect related IDs from Query A arrays; **dedupe**.
- **Cap at 50 IDs** per `POST /v4/games` batch (IGDB body size). Priority order: similar, dlcs, expansions, then others per product need.
- Overflow IDs → v1.1 per-carousel “load more” or omit with log.

---

## Server loader shape (pseudocode)

```
loadGamePage(igdbId, countryCode):
  cached = getGameCacheFromSupabase(igdbId)  // 24h TTL
  if stale or miss:
    parallel [queryA, queryB?, queryD, loadLudiRatings, loadCommentsCount]
    normalized = normalize(...)
    upsertGameCache(igdbId, normalized)
    cached = normalized
  steamAppid = extractSteam(cached)
  itad = steamAppid ? fetchItadPrices(steamAppid, countryCode) : null
  relatedCards = queryC(collectRelatedIds(cached, maxIds=50))
  return merge(cached, itad, relatedCards, ludiRatings)
```

Stream sections with React `Suspense` boundaries per pages skill.

---

## Regression checks (data layer)

- [ ] All IGDB calls server-side; [Twitch token (client credentials)](#twitch-token-client-credentials) helper caches/refreshes Bearer token (~50 min or `expires_in` buffer).
- [ ] Game page loads with ≤4 IGDB requests + ≤2 ITAD requests typical case.
- [ ] `steam_appid` extracted and stored on normalized object.
- [ ] ITAD prices respect `country` param and affiliate URLs intact.
- [ ] Composite rating excludes `total_rating` double-count.
- [ ] Related IDs batched in single `games` query (**≤50** per batch).
- [ ] Cache headers/TTLs match table above.
- [ ] 404 when IGDB returns empty for `igdbId`.
- [ ] `game_cache` upsert after successful game page load.
- [ ] ITAD country fallback **`US`** when preference chain empty.

---

## Known gaps / deferred

| Gap | Notes |
|-----|--------|
| `related.mods` IGDB carousel | Always `[]`; Nexus link only on game page UI |
| Materialized `game_ratings` avg | Query on load today |
| Slug URLs, accessibility data source | [v1.1 backlog](../ludi-decisions/SKILL.md#v11-backlog) |

---

## Resolved

| Topic | Decision |
|-------|----------|
| `game_ratings` avg | Query on load v1; materialized → v1.1 |
| Related ID cap | **50** per batch ([ludi-decisions](../ludi-decisions/SKILL.md)) |
