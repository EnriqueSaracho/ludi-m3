import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { MAX_LIST_ITEMS, type SystemListKey } from "@/lib/game/types";

type Client = SupabaseClient<Database>;

export async function getSystemListId(
  supabase: Client,
  userId: string,
  systemKey: SystemListKey,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_lists")
    .select("id")
    .eq("user_id", userId)
    .eq("system_key", systemKey)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getNextSortOrder(
  supabase: Client,
  listId: string,
): Promise<number> {
  const { data } = await supabase
    .from("list_items")
    .select("sort_order")
    .eq("list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}

export async function countListItems(
  supabase: Client,
  listId: string,
): Promise<number> {
  const { count } = await supabase
    .from("list_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId);
  return count ?? 0;
}

export async function addToSystemList(
  supabase: Client,
  userId: string,
  systemKey: SystemListKey,
  igdbId: number,
  platform?: { platform_id?: number; platform_name?: string },
) {
  const listId = await getSystemListId(supabase, userId, systemKey);
  if (!listId) return { error: "List not found" };

  const count = await countListItems(supabase, listId);
  if (count >= MAX_LIST_ITEMS) {
    return { error: "This list is full (10,000 games max)." };
  }

  const sortOrder = await getNextSortOrder(supabase, listId);
  const { error } = await supabase.from("list_items").upsert(
    {
      list_id: listId,
      igdb_id: igdbId,
      sort_order: sortOrder,
      platform_id: platform?.platform_id ?? null,
      platform_name: platform?.platform_name ?? null,
    },
    { onConflict: "list_id,igdb_id", ignoreDuplicates: true },
  );

  return { error: error?.message };
}
