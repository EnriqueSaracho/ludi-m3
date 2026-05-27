"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GameCard } from "@/components/game-card/GameCard";
import type { GameCardPayload } from "@/lib/game/types";
import { removeListItem, renameList, reorderListItems } from "@/lib/lists/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUS_LIST_KEYS } from "@/lib/game/types";

type Item = { igdb_id: number; sort_order: number };

function SortableCard({
  game,
  onRemove,
  needsConfirm,
}: {
  game: GameCardPayload;
  onRemove: () => void;
  needsConfirm: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: game.igdbId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-4 rounded-lg border p-3"
    >
      <button
        type="button"
        className="mt-8 cursor-grab touch-none text-muted-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <GameCard game={game} size="sm" showSave={false} className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="shrink-0"
      >
        {needsConfirm ? "Remove…" : "Remove"}
      </Button>
    </div>
  );
}

type Props = {
  list: {
    id: string;
    name: string;
    is_system: boolean;
    system_key: string | null;
  };
  initialCards: GameCardPayload[];
  initialItems: Item[];
};

export function ListPageClient({ list, initialCards, initialItems }: Props) {
  const [cards, setCards] = useState(initialCards);
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState(list.name);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [renamePending, setRenamePending] = useState(false);
  const [removePending, setRemovePending] = useState(false);

  const needsConfirm =
    !!list.system_key &&
    STATUS_LIST_KEYS.includes(
      list.system_key as (typeof STATUS_LIST_KEYS)[number],
    );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 500, tolerance: 5 },
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((c) => c.igdbId === active.id);
    const newIndex = cards.findIndex((c) => c.igdbId === over.id);
    const newCards = arrayMove(cards, oldIndex, newIndex);
    setCards(newCards);
    setIsSavingOrder(true);
    try {
      await reorderListItems(
        list.id,
        newCards.map((c) => c.igdbId),
      );
    } finally {
      setIsSavingOrder(false);
    }
  }

  async function doRemove(igdbId: number) {
    setRemovePending(true);
    try {
      await removeListItem(list.id, igdbId);
      setCards((prev) => prev.filter((c) => c.igdbId !== igdbId));
      setItems((prev) => prev.filter((i) => i.igdb_id !== igdbId));
      setConfirmRemove(null);
    } finally {
      setRemovePending(false);
    }
  }

  async function saveRename() {
    if (!list.is_system) {
      setRenamePending(true);
      try {
        await renameList(list.id, name);
      } finally {
        setRenamePending(false);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {list.is_system ? (
          <h1 className="text-2xl font-semibold">{list.name}</h1>
        ) : (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs text-xl font-semibold"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={saveRename}
              disabled={renamePending}
              aria-busy={renamePending}
            >
              {renamePending ? "Saving…" : "Save name"}
            </Button>
          </>
        )}
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isSavingOrder ? "Saving order…" : ""}
      </div>
      {isSavingOrder && (
        <p className="text-sm text-muted-foreground">Saving order…</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cards.map((c) => c.igdbId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {cards.map((game) => (
              <SortableCard
                key={game.igdbId}
                game={game}
                needsConfirm={needsConfirm}
                onRemove={() =>
                  needsConfirm
                    ? setConfirmRemove(game.igdbId)
                    : doRemove(game.igdbId)
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {cards.length === 0 && (
        <p className="text-muted-foreground">This list is empty.</p>
      )}

      <Dialog
        open={confirmRemove != null}
        onOpenChange={() => setConfirmRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from list?</DialogTitle>
            <DialogDescription>
              This will also clear your play status for this game if it matches
              this list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={removePending}
              aria-busy={removePending}
              onClick={() => confirmRemove != null && doRemove(confirmRemove)}
            >
              {removePending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
