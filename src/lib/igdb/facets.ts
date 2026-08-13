import { unstable_cache } from "next/cache";
import { igdbFetch } from "@/lib/igdb/client";

export type FacetOption = { id: number; name: string };

/* IGDB sorts platforms alphabetically, which buries the ones anyone filters by
   under 1970s hardware. These float to the top of the facet list in order; the
   rest follow alphabetically. */
const PLATFORM_PRIORITY = [
  "PC (Microsoft Windows)",
  "PlayStation 5",
  "Xbox Series X|S",
  "Nintendo Switch 2",
  "Nintendo Switch",
  "PlayStation 4",
  "Xbox One",
  "Mac",
  "Linux",
  "iOS",
  "Android",
  "PlayStation 3",
  "Xbox 360",
  "Nintendo 3DS",
  "Wii U",
  "Wii",
  "PlayStation Vita",
];

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
