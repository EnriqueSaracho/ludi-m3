"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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

/** The shadcn checkbox item ships a bare tick floating at the left edge. These
 *  arbitrary variants re-dress that same indicator span as a proper square
 *  checkbox — hairline when off, brand-filled when on — without forking the
 *  primitive, which other menus rely on as-is. */
const CHECK_ITEM =
  "group relative h-9 rounded-sm pl-9 pr-2.5 text-[0.8125rem] text-copy " +
  "transition-colors focus:bg-raised focus:text-white " +
  "data-[state=checked]:text-white " +
  "[&>span:first-child]:left-2.5 [&>span:first-child]:h-4 [&>span:first-child]:w-4 " +
  "[&>span:first-child]:rounded-[3px] [&>span:first-child]:border " +
  "[&>span:first-child]:border-hairline-strong [&>span:first-child]:transition-colors " +
  "group-hover:[&>span:first-child]:border-brand-tint/50 " +
  "data-[state=checked]:[&>span:first-child]:border-brand " +
  "data-[state=checked]:[&>span:first-child]:bg-brand " +
  "[&>span:first-child_svg]:h-3 [&>span:first-child_svg]:w-3 " +
  "[&>span:first-child_svg]:text-white";

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
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-64 border-hairline bg-elevated p-1.5 shadow-[0_28px_64px_-20px_rgb(0_0_0/0.9)]"
      >
        <DropdownMenuLabel className="px-2.5 pb-2 pt-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-faint">
          Save to list
        </DropdownMenuLabel>
        {error && (
          <p
            className="mx-1 mb-1 rounded-sm bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {custom.map((list) => (
          <DropdownMenuCheckboxItem
            key={list.id}
            className={CHECK_ITEM}
            checked={list.checked}
            disabled={pendingIds.has(list.id) || unsavePending}
            onCheckedChange={(v) => toggle(list, !!v)}
          >
            <span className="truncate">{list.name}</span>
            {pendingIds.has(list.id) && (
              <Spinner size="sm" className="ml-auto h-3.5 w-3.5" />
            )}
          </DropdownMenuCheckboxItem>
        ))}
        {custom.length > 0 && system.length > 0 && (
          <DropdownMenuSeparator className="mx-1 my-1.5 bg-hairline" />
        )}
        {system.map((list) => (
          <DropdownMenuCheckboxItem
            key={list.id}
            className={CHECK_ITEM}
            checked={list.checked}
            disabled={
              pendingIds.has(list.id) ||
              unsavePending ||
              (list.system_key === "games_rated" && list.checked)
            }
            onCheckedChange={(v) => toggle(list, !!v)}
          >
            <span className="truncate">{list.name}</span>
            {pendingIds.has(list.id) && (
              <Spinner size="sm" className="ml-auto h-3.5 w-3.5" />
            )}
          </DropdownMenuCheckboxItem>
        ))}
        {canUnsave && (
          <>
            <DropdownMenuSeparator className="mx-1 my-1.5 bg-hairline" />
            <DropdownMenuItem
              className="h-9 gap-2.5 rounded-sm px-2.5 text-[0.8125rem] text-destructive transition-colors focus:bg-destructive/10 focus:text-destructive [&_svg]:size-3.5"
              disabled={unsavePending}
              onSelect={(e) => {
                e.preventDefault();
                void handleUnsave();
              }}
            >
              <Trash2 strokeWidth={1.5} />
              <span>Remove from all lists</span>
              {unsavePending && <Spinner size="sm" className="ml-auto" />}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
