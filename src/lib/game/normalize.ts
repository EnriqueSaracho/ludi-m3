import {
  compositeRating,
  formatReleaseDate,
} from "@/lib/game/composite-rating";
import type { GameCardPayload } from "@/lib/game/types";

export type IgdbGameRow = {
  id: number;
  name: string;
  slug: string;
  cover?: { image_id?: string } | null;
  first_release_date?: number | null;
  game_type?: { type?: string } | null;
  rating?: number | null;
  aggregated_rating?: number | null;
  rating_count?: number | null;
  aggregated_rating_count?: number | null;
};

export function toGameCardPayload(game: IgdbGameRow): GameCardPayload {
  return {
    igdbId: game.id,
    slug: game.slug,
    name: game.name,
    coverImageId: game.cover?.image_id ?? null,
    compositeRating: compositeRating(game),
    releaseDate: formatReleaseDate(game.first_release_date),
    contentType: game.game_type?.type ?? null,
  };
}

export function extractSteamAppId(
  externalGames?: Array<{
    uid?: string;
    external_game_source?: { name?: string };
  }>,
): number | null {
  if (!externalGames) return null;
  const steam = externalGames.find(
    (e) =>
      e.external_game_source?.name?.toLowerCase().includes("steam") &&
      e.uid,
  );
  if (!steam?.uid) return null;
  const id = parseInt(steam.uid, 10);
  return Number.isNaN(id) ? null : id;
}
