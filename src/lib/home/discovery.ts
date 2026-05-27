import { unstable_cache } from "next/cache";
import { igdbFetch } from "@/lib/igdb/client";
import gameTypeIds from "@/lib/igdb/game-type-ids.json";
import { toGameCardPayload, type IgdbGameRow } from "@/lib/game/normalize";
import type { GameCardPayload } from "@/lib/game/types";

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
    ["home-new-releases"],
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
where rating != null & rating_count > 5 & game_type = (${mainIds.join(",")}) & version_parent = null;
sort rating desc;
limit 12;`,
      );
      return rows.map(toGameCardPayload);
    },
    ["home-top-rated"],
    { revalidate: 86400 },
  )();
}
