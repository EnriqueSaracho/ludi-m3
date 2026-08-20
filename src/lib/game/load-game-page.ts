import { createServiceClient } from "@/lib/supabase/server";
import { igdbFetch } from "@/lib/igdb/client";
import {
  extractSteamAppId,
  toGameCardPayload,
  type IgdbGameRow,
} from "@/lib/game/normalize";
import type { GameCardPayload } from "@/lib/game/types";
import {
  fetchItadPrices,
  lookupItadGame,
  minCurrentPrice,
  type ItadPriceDeal,
} from "@/lib/itad/client";
import { createClient } from "@/lib/supabase/server";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Bump whenever CORE_FIELDS changes shape.
 *
 *  `game_cache` stores the raw IGDB response, so newly requested fields are
 *  missing from existing rows until their 24h TTL lapses. Gating the cache read
 *  on this retires stale-shaped payloads at deploy time instead. */
const PAYLOAD_VERSION = 3;

/* `videos` needs its sub-fields spelled out — bare, IGDB returns raw numeric
   ids. `artworks.artwork_type` is what separates key art from concept art and
   from logos/icons/covers (see src/lib/game/media.ts). */
const CORE_FIELDS = `id, name, slug, summary, storyline, first_release_date,
  cover.image_id, game_type.type,
  genres.name, themes.name, platforms.name,
  game_modes.name, involved_companies.company.name,
  involved_companies.developer, involved_companies.publisher,
  websites.url, websites.type,
  external_games.uid, external_games.external_game_source.name,
  rating, rating_count, aggregated_rating, aggregated_rating_count,
  similar_games, dlcs, expansions, standalone_expansions, expanded_games,
  bundles, ports, remakes, remasters, forks,
  parent_game, version_parent, version_title,
  videos.video_id, videos.name,
  screenshots.image_id, artworks.image_id, artworks.artwork_type`;

/** Shared by the forward id batch and the reverse child query. `game_type.id`
 *  rides along because child rows are bucketed by type, not by which array they
 *  came from. */
const CARD_FIELDS = `id, name, slug, cover.image_id, first_release_date,
  game_type.id, game_type.type,
  rating, aggregated_rating, rating_count, aggregated_rating_count`;

/** Ids pulled from the core payload's relation arrays, resolved in one batch.
 *  IGDB caps `limit` at 500; 100 keeps the request body small while leaving
 *  room for a long DLC list without starving the similar-games tail. */
const FORWARD_ID_LIMIT = 100;

/** Reverse children (mods, updates, editions…) can run into the hundreds —
 *  Minecraft alone has 274. */
const CHILD_LIMIT = 200;

/** Per-carousel cap. Rows scroll, but nobody scrolls past two dozen covers. */
const BUCKET_LIMIT = 30;

/* Relation coverage, verified against the live API:

   Forward arrays on /v4/games — dlcs, expansions, standalone_expansions,
   expanded_games, bundles, ports, remakes, remasters, forks, similar_games,
   parent_game, version_parent.

   There is NO array for mods, updates, editions, episodes, seasons or packs;
   requesting them 400s. Those relate the other way: children carry
   `parent_game` (or `version_parent`, for editions) and declare themselves via
   `game_type`. Hence the reverse query below. */
const CHILD_TYPE_BUCKET: Record<number, RelatedKey> = {
  1: "dlcs",
  2: "expansions",
  3: "bundles",
  4: "expansions", // Standalone Expansion
  5: "mods",
  6: "episodes",
  7: "seasons",
  8: "remakes",
  9: "remasters",
  10: "expanded",
  11: "ports",
  12: "forks",
  13: "packs", // Pack / Addon
  14: "updates",
};

/** Render order, top to bottom. The main game leads so a DLC/port/edition page
 *  can navigate back to it; similar games trail everything because they are the
 *  only bucket that is not actually the same game. */
export const RELATED_ORDER = [
  "parent",
  "editions",
  "expansions",
  "dlcs",
  "packs",
  "episodes",
  "seasons",
  "updates",
  "bundles",
  "ports",
  "remakes",
  "remasters",
  "expanded",
  "forks",
  "mods",
  "similar",
] as const;

export type RelatedKey = (typeof RELATED_ORDER)[number];

/** Which core-payload arrays seed each bucket. Buckets absent here are fed
 *  entirely by reverse children. */
const FORWARD_FIELDS: Partial<Record<RelatedKey, string[]>> = {
  expansions: ["expansions", "standalone_expansions"],
  dlcs: ["dlcs"],
  bundles: ["bundles"],
  ports: ["ports"],
  remakes: ["remakes"],
  remasters: ["remasters"],
  expanded: ["expanded_games"],
  forks: ["forks"],
  similar: ["similar_games"],
};

type IgdbChildRow = IgdbGameRow & {
  game_type?: { id?: number; type?: string } | null;
  parent_game?: number | null;
  version_parent?: number | null;
};

export type GamePageData = {
  game: Record<string, unknown>;
  related: Record<string, GameCardPayload[]>;
  steamAppId: number | null;
  itadId: string | null;
  prices: ItadPriceDeal[];
  heroPrice: { amount: number; currency: string } | null;
  ludiAvgRating: number | null;
  userRating: number | null;
  comments: Array<{
    id: string;
    body: string;
    created_at: string;
    username: string;
    avatar_url: string | null;
  }>;
};

/** Relation ids from the core payload, in priority order — the parents lead so
 *  the "go back to the main game" row survives the batch cap. */
function collectRelatedIds(game: Record<string, unknown>): number[] {
  const ids = new Set<number>();

  for (const key of ["parent_game", "version_parent"]) {
    const id = game[key] as number | undefined;
    if (typeof id === "number") ids.add(id);
  }

  for (const key of RELATED_ORDER) {
    for (const field of FORWARD_FIELDS[key] ?? []) {
      const arr = game[field] as number[] | undefined;
      if (arr) arr.forEach((id) => ids.add(id));
    }
  }

  return [...ids].slice(0, FORWARD_ID_LIMIT);
}

async function fetchFromIgdb(igdbId: number) {
  const games = await igdbFetch<Record<string, unknown>[]>(
    "games",
    `where id = ${igdbId};\nfields ${CORE_FIELDS};`,
  );
  const game = games[0];
  return game ? { ...game, _v: PAYLOAD_VERSION } : null;
}

/** Everything that points *back* at this game: mods, updates, episodes,
 *  seasons, packs and editions have no forward array to read. */
async function fetchChildGames(igdbId: number): Promise<IgdbChildRow[]> {
  return igdbFetch<IgdbChildRow[]>(
    "games",
    `where parent_game = ${igdbId} | version_parent = ${igdbId};
     fields ${CARD_FIELDS}, parent_game, version_parent, version_title;
     sort first_release_date asc;
     limit ${CHILD_LIMIT};`,
  );
}

async function fetchRelatedCards(ids: number[]): Promise<GameCardPayload[]> {
  if (ids.length === 0) return [];
  const rows = await igdbFetch<IgdbGameRow[]>(
    "games",
    `where id = (${ids.join(",")});\nfields ${CARD_FIELDS};\nlimit ${FORWARD_ID_LIMIT};`,
  );
  return rows.map(toGameCardPayload);
}

function bucketRelated(
  igdbId: number,
  game: Record<string, unknown>,
  cards: GameCardPayload[],
): Record<string, GameCardPayload[]> {
  const byId = new Map(cards.map((c) => [c.igdbId, c]));

  /* A game can sit in several relations at once — Skyrim's Legendary Edition is
     both a `bundles` entry and a version child. Buckets are filled in render
     order and claim ids as they go, so each card shows up exactly once, in the
     most specific row. */
  const claimed = new Set<number>([igdbId]);

  const childrenByBucket = new Map<RelatedKey, GameCardPayload[]>();
  for (const row of (game._children as IgdbChildRow[] | undefined) ?? []) {
    const bucket =
      row.version_parent === igdbId
        ? "editions"
        : CHILD_TYPE_BUCKET[row.game_type?.id ?? -1];
    if (!bucket) continue;
    const list = childrenByBucket.get(bucket) ?? [];
    list.push(toGameCardPayload(row));
    childrenByBucket.set(bucket, list);
  }

  const related: Record<string, GameCardPayload[]> = {};

  for (const key of RELATED_ORDER) {
    const candidates: GameCardPayload[] = [];

    if (key === "parent") {
      for (const field of ["parent_game", "version_parent"]) {
        const id = game[field] as number | undefined;
        const card = typeof id === "number" ? byId.get(id) : undefined;
        if (card) candidates.push(card);
      }
    }

    for (const field of FORWARD_FIELDS[key] ?? []) {
      for (const id of (game[field] as number[] | undefined) ?? []) {
        const card = byId.get(id);
        if (card) candidates.push(card);
      }
    }

    candidates.push(...(childrenByBucket.get(key) ?? []));

    const picked: GameCardPayload[] = [];
    for (const card of candidates) {
      if (claimed.has(card.igdbId)) continue;
      claimed.add(card.igdbId);
      picked.push(card);
      if (picked.length === BUCKET_LIMIT) break;
    }
    related[key] = picked;
  }

  return related;
}

export async function loadGamePage(
  igdbId: number,
  country: string,
): Promise<GamePageData | null> {
  const service = await createServiceClient();
  const { data: cached } = await service
    .from("game_cache")
    .select("payload, steam_appid, fetched_at")
    .eq("igdb_id", igdbId)
    .maybeSingle();

  let game: Record<string, unknown> | null = null;
  let steamAppId: number | null = null;

  const cachedPayload = cached?.payload as Record<string, unknown> | null;

  if (
    cachedPayload &&
    cachedPayload._v === PAYLOAD_VERSION &&
    cached?.fetched_at &&
    Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS
  ) {
    game = cachedPayload;
    steamAppId = cached.steam_appid;
  }

  if (!game) {
    game = await fetchFromIgdb(igdbId);
    if (!game) return null;

    /* Cached alongside the core payload so warm loads stay at one related
       request instead of two. Failure here must not cost us the page. */
    game._children = await fetchChildGames(igdbId).catch(() => []);

    steamAppId = extractSteamAppId(
      game.external_games as Parameters<typeof extractSteamAppId>[0],
    );

    await service.from("game_cache").upsert({
      igdb_id: igdbId,
      payload: game as never,
      steam_appid: steamAppId,
      fetched_at: new Date().toISOString(),
    });
  }

  const relatedIds = collectRelatedIds(game);
  const relatedCards = await fetchRelatedCards(relatedIds);
  const related = bucketRelated(igdbId, game, relatedCards);

  let itadId: string | null = null;
  let prices: ItadPriceDeal[] = [];
  if (steamAppId) {
    itadId = await lookupItadGame(steamAppId);
    if (itadId) {
      prices = await fetchItadPrices(itadId, country);
    }
  }

  const supabase = await createClient();
  const { data: ratings } = await supabase
    .from("game_ratings")
    .select("score")
    .eq("igdb_id", igdbId);

  const scores = ratings?.map((r) => Number(r.score)) ?? [];
  const ludiAvgRating =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRating: number | null = null;
  if (user) {
    const { data: mine } = await supabase
      .from("game_ratings")
      .select("score")
      .eq("igdb_id", igdbId)
      .eq("user_id", user.id)
      .maybeSingle();
    userRating = mine ? Number(mine.score) : null;
  }

  const { data: commentRows } = await supabase
    .from("game_comments")
    .select("id, body, created_at, user_id")
    .eq("igdb_id", igdbId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const userIds = [...new Set(commentRows?.map((c) => c.user_id) ?? [])];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const comments =
    commentRows?.map((c) => {
      const p = profileMap.get(c.user_id);
      return {
        id: c.id,
        body: c.body,
        created_at: c.created_at,
        username: p?.username ?? "User",
        avatar_url: p?.avatar_url ?? null,
      };
    }) ?? [];

  return {
    game,
    related,
    steamAppId,
    itadId,
    prices,
    heroPrice: minCurrentPrice(prices),
    ludiAvgRating,
    userRating,
    comments,
  };
}
