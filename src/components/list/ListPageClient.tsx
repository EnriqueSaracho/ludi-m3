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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

type Item = { igdb_id: number; sort_order: number };

/* The chips sit on top of cover art, so they carry their own scrim-backed pill
   rather than borrowing the surface colours used elsewhere. */
const chip =
  "pointer-events-auto flex items-center rounded-full bg-void/70 text-white/85 ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-void/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

function SortableCard({
  game,
  position,
  onRemove,
  needsConfirm,
}: {
  game: GameCardPayload;
  position: number;
  onRemove: () => void;
  needsConfirm: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game.igdbId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-20")}
    >
      <GameCard
        game={game}
        showSave={false}
        overlay={
          <div
            className={cn(
              // Pointer devices reveal the controls on hover; touch devices have
              // no hover state, so they keep them on screen.
              "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200",
              "group-hover:opacity-100 group-focus-within:opacity-100",
              "[@media(hover:none)]:opacity-100",
              isDragging && "opacity-100",
            )}
          >
            <div className="absolute inset-x-0 top-0 h-1/3 rounded-t-lg bg-gradient-to-b from-void/75 to-transparent" />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
              <button
                type="button"
                className={cn(
                  chip,
                  "touch-none gap-0.5 py-1 pl-1 pr-2 text-[0.6875rem] tabular-nums",
                  isDragging ? "cursor-grabbing" : "cursor-grab",
                )}
                aria-label={`Drag to reorder ${game.name}`}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
                {position}
              </button>
              <button
                type="button"
                className={cn(chip, "cursor-pointer p-1.5")}
                aria-label={
                  needsConfirm
                    ? `Remove ${game.name} from this list…`
                    : `Remove ${game.name} from this list`
                }
                onClick={onRemove}
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        }
      />
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
    <div className="shell space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3">
        {list.is_system ? (
          <h1 className="text-3xl font-light tracking-tight">{list.name}</h1>
        ) : (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="List name"
              className="h-11 max-w-xs text-lg"
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
        {cards.length > 0 && (
          <span className="text-sm tabular-nums text-muted-foreground">
            {cards.length} {cards.length === 1 ? "game" : "games"}
          </span>
        )}
        <span
          className={cn(
            "ml-auto text-sm text-muted-foreground transition-opacity duration-200",
            isSavingOrder ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        >
          Saving order…
        </span>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isSavingOrder ? "Saving order…" : ""}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cards.map((c) => c.igdbId)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {cards.map((game, index) => (
              <SortableCard
                key={game.igdbId}
                game={game}
                position={index + 1}
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
