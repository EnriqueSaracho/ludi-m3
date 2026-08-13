import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListPreview } from "@/lib/lists/queries";
import { GameRow } from "@/components/game-card/GameRow";
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
    <div className="shell space-y-12 py-10">
      <ProfileEditor
        username={profile?.username ?? "User"}
        avatarUrl={profile?.avatar_url ?? null}
        userId={user.id}
      />

      <section id="lists" className="scroll-mt-20 space-y-10">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <h2 className="text-2xl font-light tracking-tight">My lists</h2>
          <NewListDialog />
        </div>

        {previews.map(({ list, cards }) => (
          <div key={list.id}>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h3 className="text-base text-foreground">{list.name}</h3>
              <Link
                href={`/list/${list.id}`}
                className="text-[0.8125rem] text-muted-foreground transition-colors hover:text-brand-tint"
              >
                See all
              </Link>
            </div>
            {cards.length === 0 ? (
              <p className="rounded-md border border-dashed border-hairline px-4 py-8 text-center text-sm text-muted-foreground">
                No games yet.
              </p>
            ) : (
              <GameRow games={cards} />
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
