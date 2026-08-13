import { unstable_cache } from "next/cache";
import { igdbFetch } from "@/lib/igdb/client";
import gameTypeIds from "@/lib/igdb/game-type-ids.json";
import { toGameCardPayload, type IgdbGameRow } from "@/lib/game/normalize";
import { CARD_PAYLOAD_VERSION, type GameCardPayload } from "@/lib/game/types";

const FIELDS = `id, name, slug, cover.image_id, first_release_date, game_type.type,
  rating, aggregated_rating, rating_count, aggregated_rating_count`;

export async function getNewReleases(): Promise<GameCardPayload[]> {
  return unstable_cache(
    async () => {
      const mainIds = (gameTypeIds as { main: number[] }).main;
      const now = Math.floor(Date.now() / 1000);
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60;
      const rows = await igdbFetch<IgdbGameRow[]>(
        "games",
        `fields ${FIELDS};
where first_release_date >= ${ninetyDaysAgo} & first_release_date <= ${now}
  & game_type = (${mainIds.join(",")}) & version_parent = null & rating != null;
sort first_release_date desc;
limit 12;`,
      );
      return rows.map(toGameCardPayload);
    },
    ["home-new-releases", CARD_PAYLOAD_VERSION],
    { revalidate: 86400 },
  )();
}

export type FeaturedGame = {
  igdbId: number;
  name: string;
  summary: string | null;
  /** Wide art for the hero — artwork if the game has one, else a screenshot. */
  backdropImageId: string | null;
};

type FeaturedRow = IgdbGameRow & {
  summary?: string | null;
  artworks?: Array<{ image_id?: string }> | null;
  screenshots?: Array<{ image_id?: string }> | null;
};

/** Highly-rated recent games that have wide art, for the home hero carousel. */
export async function getFeatured(): Promise<FeaturedGame[]> {
  return unstable_cache(
    async () => {
      const mainIds = (gameTypeIds as { main: number[] }).main;
      const now = Math.floor(Date.now() / 1000);
      const twoYearsAgo = now - 730 * 24 * 60 * 60;
      const rows = await igdbFetch<FeaturedRow[]>(
        "games",
        `fields id, name, slug, summary, cover.image_id, artworks.image_id,
  screenshots.image_id, first_release_date, game_type.type,
  rating, aggregated_rating, rating_count, aggregated_rating_count;
where first_release_date >= ${twoYearsAgo} & first_release_date <= ${now}
  & game_type = (${mainIds.join(",")}) & version_parent = null
  & rating != null & rating_count > 150 & artworks != null;
sort rating desc;
limit 5;`,
      );

      return rows.map((row) => ({
        igdbId: row.id,
        name: row.name,
        summary: row.summary ?? null,
        backdropImageId:
          row.artworks?.[0]?.image_id ?? row.screenshots?.[0]?.image_id ?? null,
      }));
    },
    ["home-featured", CARD_PAYLOAD_VERSION],
    { revalidate: 86400 },
  )();
}

export async function getTopRated(): Promise<GameCardPayload[]> {
  return unstable_cache(
    async () => {
      const mainIds = (gameTypeIds as { main: number[] }).main;
      const rows = await igdbFetch<IgdbGameRow[]>(
        "games",
        `fields ${FIELDS};
where rating != null & rating_count > 400 & game_type = (${mainIds.join(",")}) & version_parent = null;
sort rating desc;
limit 12;`,
      );
      return rows.map(toGameCardPayload);
    },
    ["home-top-rated", CARD_PAYLOAD_VERSION],
    { revalidate: 86400 },
  )();
}
