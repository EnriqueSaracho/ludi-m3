import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListPreview } from "@/lib/lists/queries";
import { GameCard } from "@/components/game-card/GameCard";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { NewListDialog } from "@/components/profile/NewListDialog";

const SYSTEM_ORDER = [
  "currently_playing",
  "games_played",
  "want_to_play",
  "games_rated",
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: lists } = await supabase
    .from("user_lists")
    .select("*")
    .eq("user_id", user.id);

  const systemLists =
    lists
      ?.filter((l) => l.is_system)
      .sort(
        (a, b) =>
          SYSTEM_ORDER.indexOf(a.system_key ?? "") -
          SYSTEM_ORDER.indexOf(b.system_key ?? ""),
      ) ?? [];

  const customLists =
    lists?.filter((l) => !l.is_system).sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  const previews = await Promise.all(
    [...systemLists, ...customLists].map(async (list) => ({
      list,
      cards: await getListPreview(list.id, 6),
    })),
  );

  return (
    <div className="space-y-10">
      <ProfileEditor
        username={profile?.username ?? "User"}
        avatarUrl={profile?.avatar_url ?? null}
        userId={user.id}
      />

      <section id="lists" className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My lists</h2>
          <NewListDialog />
        </div>

        {previews.map(({ list, cards }) => (
          <div key={list.id}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">{list.name}</h3>
              <Link href={`/list/${list.id}`} className="text-sm text-primary">
                See all
              </Link>
            </div>
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No games yet.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {cards.map((g) => (
                  <GameCard key={g.igdbId} game={g} size="sm" showSave={false} />
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
