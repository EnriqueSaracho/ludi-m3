import { searchGames } from "@/lib/search/search-games";
import { SearchPageClient } from "@/components/search/SearchPageClient";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchShell } from "@/components/search/SearchShell";
import { createClient } from "@/lib/supabase/server";
import { getListMembership } from "@/lib/lists/queries";
import { getGameModes, getGenres, getPlatforms } from "@/lib/igdb/facets";

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    quickFilter?: string;
    platforms?: string;
    genres?: string;
    gameModes?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim();

  if (!q) {
    return (
      <div className="shell py-24">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-light tracking-tight">Search games</h1>
          <p className="mt-3 text-[0.9375rem] text-muted-foreground">
            Enter at least 2 characters in the search bar to find games.
          </p>
        </div>
      </div>
    );
  }

  const page = parseInt(params.page ?? "1", 10);
  const platforms = params.platforms?.split(",").map(Number).filter(Boolean);
  const genres = params.genres?.split(",").map(Number).filter(Boolean);
  const gameModes = params.gameModes?.split(",").map(Number).filter(Boolean);

  const [result, platformsFacet, genresFacet, gameModesFacet] =
    await Promise.all([
      searchGames({
        q,
        page,
        sort: params.sort,
        quickFilter: params.quickFilter ?? "main",
        platforms,
        genres,
        gameModes,
      }),
      getPlatforms(),
      getGenres(),
      getGameModes(),
    ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let listMembershipByGame: Record<
    number,
    Awaited<ReturnType<typeof getListMembership>>
  > = {};

  if (user) {
    listMembershipByGame = Object.fromEntries(
      await Promise.all(
        result.items.map(async (item) => [
          item.igdbId,
          await getListMembership(user.id, item.igdbId),
        ]),
      ),
    );
  }

  return (
    <div className="shell-wide py-10">
      <h1 className="mb-8 text-2xl font-light tracking-tight">
        Results for: <strong className="font-bold text-white">{q}</strong>
      </h1>
      <SearchShell>
        <div className="flex gap-10">
          <SearchFilters
            platforms={platformsFacet}
            genres={genresFacet}
            gameModes={gameModesFacet}
          />
          <div className="min-w-0 flex-1">
            <SearchPageClient
              initialItems={result.items}
              initialHasMore={result.hasMore}
              query={q}
              listMembershipByGame={listMembershipByGame}
            />
          </div>
        </div>
      </SearchShell>
    </div>
  );
}
