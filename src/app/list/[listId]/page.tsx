import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListItemsFull } from "@/lib/lists/queries";
import { ListPageClient } from "@/components/list/ListPageClient";

type Props = { params: Promise<{ listId: string }> };

export default async function ListPage({ params }: Props) {
  const { listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/list/${listId}`);

  const data = await getListItemsFull(listId, user.id);
  if (!data) notFound();

  return (
    <ListPageClient
      list={data.list}
      initialCards={data.cards}
      initialItems={data.items.map((i) => ({
        igdb_id: i.igdb_id,
        sort_order: i.sort_order,
      }))}
    />
  );
}
