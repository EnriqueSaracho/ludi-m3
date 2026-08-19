import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getListCount, getListPreview } from "@/lib/lists/queries";
import { getFeatured, getNewReleases, getTopRated } from "@/lib/home/discovery";
import { GameCard } from "@/components/game-card/GameCard";
import { GameRow } from "@/components/game-card/GameRow";
import { HomeHero } from "@/components/home/HomeHero";
import { CoverGrid } from "@/components/home/CoverGrid";
import { PlatformBand } from "@/components/home/PlatformBand";
import { PromoBanner } from "@/components/home/PromoBanner";
import { HomeSearchHero } from "@/components/home/HomeSearchHero";
import { RecentGamesRow } from "@/components/home/RecentGamesRow";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [featured, newReleases, topRated] = await Promise.all([
    getFeatured(),
    getNewReleases(),
    getTopRated(),
  ]);

  let playingCards: Awaited<ReturnType<typeof getListPreview>> = [];
  let wantCards: Awaited<ReturnType<typeof getListPreview>> = [];
  let playingListId: string | null = null;
  let wantListId: string | null = null;
  let playingTotal = 0;
  let wantTotal = 0;

  if (user) {
    const { data: lists } = await supabase
      .from("user_lists")
      .select("id, system_key")
      .eq("user_id", user.id);

    const playing = lists?.find((l) => l.system_key === "currently_playing");
    const want = lists?.find((l) => l.system_key === "want_to_play");
    if (playing) {
      playingListId = playing.id;
      [playingCards, playingTotal] = await Promise.all([
        getListPreview(playing.id, 10),
        getListCount(playing.id),
      ]);
    }
    if (want) {
      wantListId = want.id;
      [wantCards, wantTotal] = await Promise.all([
        getListPreview(want.id, 10),
        getListCount(want.id),
      ]);
    }
  }

  return (
    <>
      <HomeHero games={featured} />

      {/* Explore — centred heading, pill search, cover-only grid. The hero
          already ends in a deep field of void, so this leads in tighter than
          the page's usual py-20 rhythm. */}
      <section className="shell pb-20 pt-14">
        <Reveal className="flex flex-col items-center gap-7">
          <h2 className="text-3xl font-light tracking-tight md:text-[2rem]">
            Explore Games
          </h2>
          <HomeSearchHero />
        </Reveal>
        <Reveal className="mt-12">
          <CoverGrid games={topRated.slice(0, 12)} />
        </Reveal>
      </section>

      {user && (playingCards.length > 0 || wantCards.length > 0) && (
        <section className="shell space-y-14 pb-20">
          {playingCards.length > 0 && (
            <Reveal>
              <SectionHead title="Continue playing" />
              <GameRow
                games={playingCards}
                seeAll={
                  playingListId
                    ? {
                        href: `/list/${playingListId}`,
                        total: playingTotal,
                        listName: "Currently playing",
                      }
                    : undefined
                }
              />
            </Reveal>
          )}
          {wantCards.length > 0 && (
            <Reveal>
              <SectionHead title="Want to play" />
              <GameRow
                games={wantCards}
                seeAll={
                  wantListId
                    ? {
                        href: `/list/${wantListId}`,
                        total: wantTotal,
                        listName: "Want to play",
                      }
                    : undefined
                }
              />
            </Reveal>
          )}
        </section>
      )}

      <PlatformBand />

      <div className="py-20">
        <Reveal>
          <PromoBanner
            title="Trailers, Art & More!"
            body="Dive into a massive collection of cinematic trailers, raw gameplay footage, breathtaking screenshots, and exclusive concept art."
            ctaLabel="Check it out"
            href={featured[0] ? `/game/${featured[0].igdbId}` : "/search?q=art"}
            backdropImageId={featured[1]?.backdropImageId ?? null}
          />
        </Reveal>
      </div>

      <section className="shell space-y-14 pb-20">
        <Reveal>
          <RecentGamesRow />
        </Reveal>

        <Reveal>
          <SectionHead title="New releases" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {newReleases.map((g) => (
              <GameCard key={g.igdbId} game={g} showSave={false} />
            ))}
          </div>
        </Reveal>
      </section>

      {!user && (
        <section className="shell pb-24">
          <Reveal className="grain relative overflow-hidden rounded-md border border-hairline bg-elevated px-8 py-14 text-center">
            <h2 className="text-2xl font-light tracking-tight md:text-3xl">
              Organize Your Gaming Experience
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.8125rem] leading-relaxed text-muted-foreground">
              Save games, track what you&apos;re playing, rate what you finish,
              and build lists that follow you across every store.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Try it out</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}

/* Rows carry their own "see all" tail card, so the head is title-only. */
function SectionHead({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-light tracking-tight">{title}</h2>
    </div>
  );
}
