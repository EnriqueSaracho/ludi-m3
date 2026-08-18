"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_CUSTOM_LISTS,
  MAX_LIST_ITEMS,
  isPlayStatusListKey,
} from "@/lib/game/types";
import {
  addToSystemList,
  countListItems,
  getNextSortOrder,
} from "@/lib/lists/sync";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return { supabase, user };
}

async function requireVerified() {
  const { supabase, user } = await requireUser();
  if (!user.email_confirmed_at) {
    throw new Error("Verify your email to comment or rate.");
  }
  return { supabase, user };
}

export async function addToList(listId: string, igdbId: number) {
  const { supabase, user } = await requireUser();

  const { data: list } = await supabase
    .from("user_lists")
    .select("id, user_id, is_system, system_key")
    .eq("id", listId)
    .single();

  if (!list || list.user_id !== user.id) throw new Error("List not found");

  const count = await countListItems(supabase, listId);
  if (count >= MAX_LIST_ITEMS) {
    throw new Error("This list is full (10,000 games max).");
  }

  const sortOrder = await getNextSortOrder(supabase, listId);
  await supabase.from("list_items").upsert(
    {
      list_id: listId,
      igdb_id: igdbId,
      sort_order: sortOrder,
    },
    { onConflict: "list_id,igdb_id", ignoreDuplicates: true },
  );

  revalidatePath(`/game/${igdbId}`);
  revalidatePath("/profile");
}

export async function unsaveGame(igdbId: number) {
  const { supabase, user } = await requireUser();

  const { data: lists } = await supabase
    .from("user_lists")
    .select("id, system_key")
    .eq("user_id", user.id);

  const listIdsToClear =
    lists
      ?.filter((l) => !l.system_key || isPlayStatusListKey(l.system_key))
      .map((l) => l.id) ?? [];

  if (listIdsToClear.length > 0) {
    await supabase
      .from("list_items")
      .delete()
      .eq("igdb_id", igdbId)
      .in("list_id", listIdsToClear);
  }

  await supabase
    .from("user_game_status")
    .delete()
    .eq("user_id", user.id)
    .eq("igdb_id", igdbId);

  revalidatePath(`/game/${igdbId}`);
  revalidatePath("/profile");
}

export async function removeListItem(listId: string, igdbId: number) {
  const { supabase } = await requireUser();

  await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("igdb_id", igdbId);

  revalidatePath(`/game/${igdbId}`);
  revalidatePath(`/list/${listId}`);
  revalidatePath("/profile");
}

export async function rateGame(igdbId: number, score: number) {
  const { supabase, user } = await requireVerified();

  if (score < 0 || score > 10) throw new Error("Score must be 0–10.");

  await supabase.from("game_ratings").upsert({
    user_id: user.id,
    igdb_id: igdbId,
    score,
    updated_at: new Date().toISOString(),
  });

  await addToSystemList(supabase, user.id, "games_rated", igdbId);
  revalidatePath(`/game/${igdbId}`);
  revalidatePath("/profile");
}

export async function postComment(igdbId: number, body: string) {
  const { supabase, user } = await requireVerified();
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("Comment must be 1–2000 characters.");
  }

  await supabase.from("game_comments").insert({
    user_id: user.id,
    igdb_id: igdbId,
    body: trimmed,
  });

  revalidatePath(`/game/${igdbId}`);
}

export async function createList(name: string) {
  const { supabase, user } = await requireUser();
  const { count } = await supabase
    .from("user_lists")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_system", false);

  if ((count ?? 0) >= MAX_CUSTOM_LISTS) {
    throw new Error("You can create up to 100 custom lists.");
  }

  const { data, error } = await supabase
    .from("user_lists")
    .insert({ user_id: user.id, name, is_system: false })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  return data.id;
}

export async function renameList(listId: string, name: string) {
  const { supabase, user } = await requireUser();
  const { data: list } = await supabase
    .from("user_lists")
    .select("is_system")
    .eq("id", listId)
    .eq("user_id", user.id)
    .single();

  if (!list || list.is_system) throw new Error("Cannot rename system lists.");

  await supabase.from("user_lists").update({ name }).eq("id", listId);
  revalidatePath(`/list/${listId}`);
  revalidatePath("/profile");
}

export async function deleteList(listId: string) {
  const { supabase, user } = await requireUser();
  const { data: list } = await supabase
    .from("user_lists")
    .select("is_system")
    .eq("id", listId)
    .eq("user_id", user.id)
    .single();

  if (!list || list.is_system) throw new Error("Cannot delete system lists.");

  await supabase.from("user_lists").delete().eq("id", listId);
  revalidatePath("/profile");
}

export async function reorderListItems(
  listId: string,
  orderedIgdbIds: number[],
) {
  const { supabase, user } = await requireUser();

  const { data: list } = await supabase
    .from("user_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .single();

  if (!list) throw new Error("List not found");

  await Promise.all(
    orderedIgdbIds.map((igdbId, index) =>
      supabase
        .from("list_items")
        .update({ sort_order: index })
        .eq("list_id", listId)
        .eq("igdb_id", igdbId),
    ),
  );

  revalidatePath(`/list/${listId}`);
  revalidatePath("/profile");
}

export async function updateProfile(data: {
  username?: string;
  preferred_country?: string | null;
  avatar_url?: string | null;
}) {
  const { supabase, user } = await requireUser();

  if (data.username) {
    const { validateUsername } = await import("@/lib/auth/validation");
    const err = validateUsername(data.username);
    if (err) throw new Error(err);
  }

  await supabase
    .from("profiles")
    .update({
      username: data.username,
      preferred_country: data.preferred_country,
      avatar_url: data.avatar_url,
    })
    .eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/settings");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
