import { unstable_cache } from "next/cache";
import { igdbFetch } from "@/lib/igdb/client";
import { toGameCardPayload, type IgdbGameRow } from "@/lib/game/normalize";
import type { GameCardPayload } from "@/lib/game/types";
import { buildIgdbSearchBody, type SearchParams } from "@/lib/search/build-query";

export type SearchResult = {
  query: string;
  page: number;
  pageSize: number;
  items: GameCardPayload[];
  hasMore: boolean;
};

function cacheKey(params: SearchParams): string {
  return JSON.stringify(params);
}

export async function searchGames(params: SearchParams): Promise<SearchResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;

  const cached = unstable_cache(
    async () => {
      const body = buildIgdbSearchBody(params);
      const rows = await igdbFetch<IgdbGameRow[]>("games", body);
      const hasMore = rows.length > pageSize;
      const slice = rows.slice(0, pageSize);
      return {
        items: slice.map(toGameCardPayload),
        hasMore,
      };
    },
    ["search", cacheKey(params)],
    { revalidate: 600 },
  );

  const { items, hasMore } = await cached();

  return {
    query: params.q,
    page,
    pageSize,
    items,
    hasMore,
  };
}
