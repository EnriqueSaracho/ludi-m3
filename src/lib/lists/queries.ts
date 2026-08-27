import { createClient } from "@/lib/supabase/server";
import { igdbFetch } from "@/lib/igdb/client";
import { toGameCardPayload, type IgdbGameRow } from "@/lib/game/normalize";
import type { GameCardPayload } from "@/lib/game/types";

export async function getUserLists() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, lists: [] };

  const { data: lists } = await supabase
    .from("user_lists")
    .select("*")
    .eq("user_id", user.id)
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });

  return { user, lists: lists ?? [] };
}

export async function getListPreview(
  listId: string,
  limit = 6,
): Promise<GameCardPayload[]> {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("list_items")
    .select("igdb_id")
    .eq("list_id", listId)
    .order("sort_order", { ascending: true })
    .limit(limit);

  const ids = items?.map((i) => i.igdb_id) ?? [];
  if (ids.length === 0) return [];

  const rows = await igdbFetch<IgdbGameRow[]>(
    "games",
    `where id = (${ids.join(",")});\nfields id, name, slug, cover.image_id, first_release_date, game_type.type, rating, aggregated_rating, rating_count, aggregated_rating_count;`,
  );

  const byId = new Map(rows.map((r) => [r.id, toGameCardPayload(r)]));
  return ids
    .map((id) => byId.get(id))
    .filter((c): c is GameCardPayload => !!c);
}

/** Total items on a list, for preview rows that show only the first few. */
export async function getListCount(listId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("list_items")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId);

  return count ?? 0;
}

export async function getSavedIgdbIds(userId: string): Promise<Set<number>> {
  const supabase = await createClient();
  const { data: lists } = await supabase
    .from("user_lists")
    .select("id")
    .eq("user_id", userId);

  const listIds = lists?.map((l) => l.id) ?? [];
  if (listIds.length === 0) return new Set();

  const { data: items } = await supabase
    .from("list_items")
    .select("igdb_id")
    .in("list_id", listIds);

  return new Set(items?.map((i) => i.igdb_id) ?? []);
}

export async function isGameSaved(
  userId: string,
  igdbId: number,
): Promise<boolean> {
  const saved = await getSavedIgdbIds(userId);
  return saved.has(igdbId);
}

export async function getListMembership(userId: string, igdbId: number) {
  const supabase = await createClient();
  const { data: lists } = await supabase
    .from("user_lists")
    .select("id, name, system_key, is_system")
    .eq("user_id", userId);

  const { data: items } = await supabase
    .from("list_items")
    .select("list_id")
    .eq("igdb_id", igdbId)
    .in(
      "list_id",
      lists?.map((l) => l.id) ?? [],
    );

  const memberIds = new Set(items?.map((i) => i.list_id) ?? []);
  return (
    lists?.map((l) => ({
      ...l,
      checked: memberIds.has(l.id),
    })) ?? []
  );
}

export async function getListItemsFull(listId: string, userId: string) {
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("user_lists")
    .select("*")
    .eq("id", listId)
    .eq("user_id", userId)
    .single();

  if (!list) return null;

  const { data: items } = await supabase
    .from("list_items")
    .select("*")
    .eq("list_id", listId)
    .order("sort_order", { ascending: true });

  const ids = items?.map((i) => i.igdb_id) ?? [];
  if (ids.length === 0) {
    return { list, items: [], cards: [] };
  }

  const rows = await igdbFetch<IgdbGameRow[]>(
    "games",
    `where id = (${ids.join(",")});\nfields id, name, slug, cover.image_id, first_release_date, game_type.type, rating, aggregated_rating, rating_count, aggregated_rating_count;\nlimit 500;`,
  );

  const byId = new Map(rows.map((r) => [r.id, toGameCardPayload(r)]));
  const cards = ids
    .map((id) => byId.get(id))
    .filter((c): c is GameCardPayload => !!c);

  return { list, items: items ?? [], cards };
}
