import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getListPreview } from "@/lib/lists/queries";
import { getNewReleases, getTopRated } from "@/lib/home/discovery";
import { GameCard } from "@/components/game-card/GameCard";
import { HomeSearchHero } from "@/components/home/HomeSearchHero";
import { RecentGamesRow } from "@/components/home/RecentGamesRow";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [newReleases, topRated] = await Promise.all([
    getNewReleases(),
    getTopRated(),
  ]);

  let playingCards: Awaited<ReturnType<typeof getListPreview>> = [];
  let wantCards: Awaited<ReturnType<typeof getListPreview>> = [];
  let playingListId: string | null = null;
  let wantListId: string | null = null;

  if (user) {
    const { data: lists } = await supabase
      .from("user_lists")
      .select("id, system_key")
      .eq("user_id", user.id);

    const playing = lists?.find((l) => l.system_key === "currently_playing");
    const want = lists?.find((l) => l.system_key === "want_to_play");
    if (playing) {
      playingListId = playing.id;
      playingCards = await getListPreview(playing.id, 6);
    }
    if (want) {
      wantListId = want.id;
      wantCards = await getListPreview(want.id, 6);
    }
  }

  return (
    <div className="space-y-12">
      <HomeSearchHero />

      {user ? (
        <>
          {playingCards.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Continue playing</h2>
                {playingListId && (
                  <Link
                    href={`/list/${playingListId}`}
                    className="text-sm text-primary"
                  >
                    See all
                  </Link>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {playingCards.map((g) => (
                  <GameCard key={g.igdbId} game={g} size="sm" showSave={false} />
                ))}
              </div>
            </section>
          )}
          {wantCards.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Want to play</h2>
                {wantListId && (
                  <Link
                    href={`/list/${wantListId}`}
                    className="text-sm text-primary"
                  >
                    See all
                  </Link>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {wantCards.map((g) => (
                  <GameCard key={g.igdbId} game={g} size="sm" showSave={false} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Sign in to track games and build lists.
          </p>
          <Button asChild className="mt-4">
            <Link href="/login?next=/">Sign in</Link>
          </Button>
        </section>
      )}

      <RecentGamesRow />

      <section>
        <h2 className="mb-4 text-lg font-semibold">New releases</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {newReleases.map((g) => (
            <GameCard key={g.igdbId} game={g} showSave={false} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Top rated</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {topRated.map((g) => (
            <GameCard key={g.igdbId} game={g} showSave={false} />
          ))}
        </div>
      </section>

      {!user && (
        <section className="rounded-lg border border-border p-8 text-center">
          <h2 className="text-xl font-semibold">Start your library</h2>
          <p className="mt-2 text-muted-foreground">
            Save games, track play status, and rate what you play.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
