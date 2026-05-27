import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadGamePage } from "@/lib/game/load-game-page";
import { resolveCountry } from "@/lib/country/resolve-country";
import { createClient } from "@/lib/supabase/server";
import { getListMembership } from "@/lib/lists/queries";
import { igdbImageUrl } from "@/lib/igdb/images";
import { GamePageClient } from "@/components/game/GamePageClient";
import type { PlayStatus } from "@/lib/game/types";

type Props = {
  params: Promise<{ igdbId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { igdbId } = await params;
  const id = parseInt(igdbId, 10);
  if (Number.isNaN(id)) return { title: "Game not found" };

  const country = await resolveCountry();
  const data = await loadGamePage(id, country);
  if (!data) return { title: "Game not found" };

  const game = data.game as { name: string; cover?: { image_id?: string } };
  const image = igdbImageUrl(game.cover?.image_id, "cover_big");

  return {
    title: `${game.name} — Ludi`,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function GamePage({ params }: Props) {
  const { igdbId } = await params;
  const id = parseInt(igdbId, 10);
  if (Number.isNaN(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("preferred_country")
        .eq("id", user.id)
        .single()
    : { data: null };

  const country = await resolveCountry(profile?.preferred_country);
  const data = await loadGamePage(id, country);
  if (!data) notFound();

  const game = data.game as {
    platforms?: Array<{ name?: string }>;
  };

  const platforms =
    game.platforms?.map((p) => p.name).filter((n): n is string => !!n) ?? [];

  let listMembership: Awaited<ReturnType<typeof getListMembership>> = [];
  let playStatus: PlayStatus | null = null;

  if (user) {
    listMembership = await getListMembership(user.id, id);
    const { data: status } = await supabase
      .from("user_game_status")
      .select("play_status")
      .eq("user_id", user.id)
      .eq("igdb_id", id)
      .maybeSingle();
    playStatus = status?.play_status ?? null;
  }

  return (
    <GamePageClient
      data={data}
      igdbId={id}
      country={country}
      isAuthed={!!user}
      emailVerified={!!user?.email_confirmed_at}
      listMembership={listMembership}
      playStatus={playStatus}
      platforms={platforms}
    />
  );
}
