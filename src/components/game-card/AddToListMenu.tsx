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
};

export function AddToListMenu({
  igdbId,
  lists: listsProp,
  open,
  onOpenChange,
  onListsChange,
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

  async function toggle(list: ListRow, checked: boolean) {
    if (list.system_key === "games_rated" && list.checked) return;

    const previous = lists;
    const optimistic = lists.map((l) =>
      l.id === list.id ? { ...l, checked } : l,
    );
    updateLists(optimistic);
    setPendingIds((prev) => new Set(prev).add(list.id));
    setError(null);

    try {
      if (checked) {
        await addToList(list.id, igdbId);
      } else {
        await removeListItem(list.id, igdbId);
      }
    } catch (err) {
      updateLists(previous);
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
    setUnsavePending(true);
    setError(null);

    try {
      await unsaveGame(igdbId);
      router.refresh();
    } catch (err) {
      updateLists(previous);
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
