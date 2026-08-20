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
const PAYLOAD_VERSION = 2;

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
  similar_games, dlcs, expansions, bundles, ports, remakes, remasters,
  forks, videos.video_id, videos.name,
  screenshots.image_id, artworks.image_id, artworks.artwork_type`;

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

function collectRelatedIds(game: Record<string, unknown>): number[] {
  const keys = [
    "similar_games",
    "dlcs",
    "expansions",
    "bundles",
    "ports",
    "remakes",
    "remasters",
    "forks",
  ];
  const ids = new Set<number>();
  for (const key of keys) {
    const arr = game[key] as number[] | undefined;
    if (arr) arr.forEach((id) => ids.add(id));
  }
  return [...ids].slice(0, 50);
}

async function fetchFromIgdb(igdbId: number) {
  const games = await igdbFetch<Record<string, unknown>[]>(
    "games",
    `where id = ${igdbId};\nfields ${CORE_FIELDS};`,
  );
  const game = games[0];
  return game ? { ...game, _v: PAYLOAD_VERSION } : null;
}

async function fetchRelatedCards(ids: number[]): Promise<GameCardPayload[]> {
  if (ids.length === 0) return [];
  const rows = await igdbFetch<IgdbGameRow[]>(
    "games",
    `where id = (${ids.join(",")});\nfields id, name, slug, cover.image_id, first_release_date, game_type.type, rating, aggregated_rating, rating_count, aggregated_rating_count;\nlimit 50;`,
  );
  return rows.map(toGameCardPayload);
}

function bucketRelated(
  game: Record<string, unknown>,
  cards: GameCardPayload[],
): Record<string, GameCardPayload[]> {
  const byId = new Map(cards.map((c) => [c.igdbId, c]));
  const pick = (ids?: number[]) =>
    (ids ?? [])
      .map((id) => byId.get(id))
      .filter((c): c is GameCardPayload => !!c);

  return {
    similar: pick(game.similar_games as number[]),
    dlcs: pick(game.dlcs as number[]),
    expansions: pick(game.expansions as number[]),
    bundles: pick(game.bundles as number[]),
    ports: pick(game.ports as number[]),
    remakes: pick(game.remakes as number[]),
    remasters: pick(game.remasters as number[]),
    mods: [],
  };
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
  const related = bucketRelated(game, relatedCards);

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
