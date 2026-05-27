"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addToList, removeListItem, unsaveGame } from "@/lib/lists/actions";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/loading/Spinner";
import {
  LIST_TO_PLAY_STATUS,
  STATUS_LIST_KEYS,
  type PlayStatus,
} from "@/lib/game/types";

type ListRow = {
  id: string;
  name: string;
  system_key: string | null;
  is_system: boolean;
  checked: boolean;
};

type Props = {
  igdbId: number;
  lists: ListRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListsChange?: (lists: ListRow[]) => void;
  onPlayStatusChange?: (status: PlayStatus | null) => void;
};

function isStatusListKey(
  key: string | null,
): key is (typeof STATUS_LIST_KEYS)[number] {
  return !!key && STATUS_LIST_KEYS.includes(key as (typeof STATUS_LIST_KEYS)[number]);
}

function playStatusForListKey(key: string | null): PlayStatus | null {
  if (!isStatusListKey(key)) return null;
  return LIST_TO_PLAY_STATUS[key];
}

export function AddToListMenu({
  igdbId,
  lists: listsProp,
  open,
  onOpenChange,
  onListsChange,
  onPlayStatusChange,
}: Props) {
  const router = useRouter();
  const [lists, setLists] = useState(listsProp);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [unsavePending, setUnsavePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLists(listsProp);
  }, [listsProp]);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  function updateLists(next: ListRow[]) {
    setLists(next);
    onListsChange?.(next);
  }

  const canUnsave = lists.some(
    (l) => l.checked && l.system_key !== "games_rated",
  );

  function optimisticCheck(list: ListRow, checked: boolean): ListRow[] {
    if (checked && isStatusListKey(list.system_key)) {
      return lists.map((l) => {
        if (l.id === list.id) return { ...l, checked: true };
        if (isStatusListKey(l.system_key)) return { ...l, checked: false };
        return l;
      });
    }
    return lists.map((l) => (l.id === list.id ? { ...l, checked } : l));
  }

  async function toggle(list: ListRow, checked: boolean) {
    if (isStatusListKey(list.system_key) && list.checked) {
      return;
    }
    if (list.system_key === "games_rated" && list.checked) return;

    const previous = lists;
    const optimistic = optimisticCheck(list, checked);
    updateLists(optimistic);
    setPendingIds((prev) => new Set(prev).add(list.id));
    setError(null);

    if (checked && isStatusListKey(list.system_key)) {
      onPlayStatusChange?.(playStatusForListKey(list.system_key));
    }

    try {
      if (checked) {
        await addToList(list.id, igdbId);
      } else {
        await removeListItem(list.id, igdbId);
      }
      if (checked && isStatusListKey(list.system_key)) {
        router.refresh();
      }
    } catch (err) {
      updateLists(previous);
      if (checked && isStatusListKey(list.system_key)) {
        const prevStatus = lists.find(
          (l) => isStatusListKey(l.system_key) && l.checked,
        );
        onPlayStatusChange?.(playStatusForListKey(prevStatus?.system_key ?? null));
      }
      setError(err instanceof Error ? err.message : "Failed to update list");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(list.id);
        return next;
      });
    }
  }

  async function handleUnsave() {
    const previous = lists;
    const optimistic = lists.map((l) =>
      l.system_key === "games_rated" ? l : { ...l, checked: false },
    );
    updateLists(optimistic);
    onPlayStatusChange?.(null);
    setUnsavePending(true);
    setError(null);

    try {
      await unsaveGame(igdbId);
      router.refresh();
    } catch (err) {
      updateLists(previous);
      const prevStatus = previous.find(
        (l) => isStatusListKey(l.system_key) && l.checked,
      );
      onPlayStatusChange?.(playStatusForListKey(prevStatus?.system_key ?? null));
      setError(err instanceof Error ? err.message : "Failed to unsave");
    } finally {
      setUnsavePending(false);
    }
  }

  const custom = lists.filter((l) => !l.is_system);
  const system = lists.filter((l) => l.is_system);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger className="sr-only" aria-hidden>
        Menu
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Save to list</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error && (
          <p className="px-2 py-1.5 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        {custom.map((list) => (
          <DropdownMenuCheckboxItem
            key={list.id}
            checked={list.checked}
            disabled={pendingIds.has(list.id) || unsavePending}
            onCheckedChange={(v) => toggle(list, !!v)}
          >
            <span className="flex items-center gap-2">
              {list.name}
              {pendingIds.has(list.id) && <Spinner size="sm" />}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {system.length > 0 && <DropdownMenuSeparator />}
        {system.map((list) => (
          <DropdownMenuCheckboxItem
            key={list.id}
            checked={list.checked}
            disabled={
              pendingIds.has(list.id) ||
              unsavePending ||
              (isStatusListKey(list.system_key) && list.checked) ||
              (list.system_key === "games_rated" && list.checked)
            }
            onCheckedChange={(v) => toggle(list, !!v)}
          >
            <span className="flex items-center gap-2">
              {list.name}
              {pendingIds.has(list.id) && <Spinner size="sm" />}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {canUnsave && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={unsavePending}
              onSelect={(e) => {
                e.preventDefault();
                void handleUnsave();
              }}
            >
              <span className="flex items-center gap-2">
                Remove from all lists
                {unsavePending && <Spinner size="sm" />}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
