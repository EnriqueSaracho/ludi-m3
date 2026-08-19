import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListCount, getListPreview } from "@/lib/lists/queries";
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
    [...systemLists, ...customLists].map(async (list) => {
      const [cards, total] = await Promise.all([
        getListPreview(list.id, 6),
        getListCount(list.id),
      ]);
      return { list, cards, total };
    }),
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

        {previews.map(({ list, cards, total }) => (
          <div key={list.id}>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h3 className="text-base text-foreground">{list.name}</h3>
            </div>
            {cards.length === 0 ? (
              /* The row's tail card is the way into a list, so an empty list
                 needs the placeholder itself to be the link. */
              <Link
                href={`/list/${list.id}`}
                className="block rounded-md border border-dashed border-hairline px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-hairline-strong hover:text-brand-tint"
              >
                No games yet.
              </Link>
            ) : (
              <GameRow
                games={cards}
                seeAll={{
                  href: `/list/${list.id}`,
                  total,
                  listName: list.name,
                }}
              />
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
