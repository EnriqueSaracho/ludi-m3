import { unstable_cache } from "next/cache";
import { igdbFetch } from "@/lib/igdb/client";
import { PLATFORM_PRIORITY } from "@/lib/game/platforms";

export type FacetOption = { id: number; name: string };

export async function getPlatforms(): Promise<FacetOption[]> {
  return unstable_cache(
    async () => {
      // `platform_type` replaced the old `category` field; filtering on
      // `category` silently matches nothing.
      const rows = await igdbFetch<{ id: number; name: string }[]>(
        "platforms",
        "fields id, name; where platform_type = (1,2,3,4,5,6); sort name asc; limit 200;",
      );

      const rank = (name: string) => {
        const i = PLATFORM_PRIORITY.indexOf(name);
        return i === -1 ? PLATFORM_PRIORITY.length : i;
      };

      return rows
        .map((r) => ({ id: r.id, name: r.name }))
        .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
    },
    ["facets-platforms"],
    { revalidate: 86400 },
  )();
}

export async function getGenres(): Promise<FacetOption[]> {
  return unstable_cache(
    async () => {
      const rows = await igdbFetch<{ id: number; name: string }[]>(
        "genres",
        "fields id, name; sort name asc; limit 100;",
      );
      return rows.map((r) => ({ id: r.id, name: r.name }));
    },
    ["facets-genres"],
    { revalidate: 86400 },
  )();
}

export async function getGameModes(): Promise<FacetOption[]> {
  return unstable_cache(
    async () => {
      const rows = await igdbFetch<{ id: number; name: string }[]>(
        "game_modes",
        "fields id, name; sort name asc; limit 50;",
      );
      return rows.map((r) => ({ id: r.id, name: r.name }));
    },
    ["facets-game-modes"],
    { revalidate: 86400 },
  )();
}
