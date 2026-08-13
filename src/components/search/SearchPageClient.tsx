"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GameCard } from "@/components/game-card/GameCard";
import { GameCardGridSkeleton } from "@/components/loading/GameCardGridSkeleton";
import { useSearchShell } from "@/components/search/SearchShell";
import type { GameCardPayload } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUICK_FILTERS = [
  { key: "all", label: "All" },
  { key: "main", label: "Main Games" },
  { key: "bundles", label: "Bundles" },
  { key: "addons", label: "Add-ons & Expansions" },
  { key: "remakes", label: "Remakes & Ports" },
  { key: "mods", label: "Mods & Community" },
];

type ListRow = {
  id: string;
  name: string;
  system_key: string | null;
  is_system: boolean;
  checked: boolean;
};

type Props = {
  initialItems: GameCardPayload[];
  initialHasMore: boolean;
  query: string;
  listMembershipByGame?: Record<number, ListRow[]>;
};

export function SearchPageClient({
  initialItems,
  initialHasMore,
  listMembershipByGame = {},
}: Props) {
  const searchParams = useSearchParams();
  const { isPending, navigateSearch } = useSearchShell();
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1", 10));
  const [loadMorePending, setLoadMorePending] = useState(false);

  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setPage(parseInt(searchParams.get("page") ?? "1", 10));
  }, [initialItems, initialHasMore, searchParams]);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadMorePending(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } finally {
      setLoadMorePending(false);
    }
  }, [page, searchParams]);

  function updateParam(key: string, value: string) {
    navigateSearch((params) => {
      params.set(key, value);
      params.delete("page");
    });
  }

  const controlsDisabled = isPending || loadMorePending;
  const activeFilter = searchParams.get("quickFilter") ?? "main";

  return (
    <div>
      {/* Content-type strip. Purple outline marks the active tab, matching the
          prototype; the strip scrolls on narrow viewports. */}
      <div
        className="scroll-pill -mx-1 flex gap-2 overflow-x-auto px-1 pb-3"
        role="toolbar"
        aria-label="Filter by content type"
      >
        {QUICK_FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              disabled={controlsDisabled}
              aria-pressed={active}
              onClick={() => updateParam("quickFilter", f.key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md border px-4 py-2 text-sm transition-all duration-200",
                "disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-brand bg-brand/10 text-white"
                  : "border-transparent text-copy hover:bg-elevated hover:text-white",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-[0.8125rem] text-muted-foreground" aria-live="polite">
          {items.length} {items.length === 1 ? "result" : "results"}
        </p>
        <div className="flex items-center gap-2.5">
          <label
            htmlFor="sort-select"
            className="text-[0.8125rem] text-muted-foreground"
          >
            Sort by
          </label>
          <Select
            value={searchParams.get("sort") ?? "relevance"}
            onValueChange={(v) => updateParam("sort", v)}
            disabled={controlsDisabled}
          >
            <SelectTrigger
              id="sort-select"
              className="w-40"
              aria-busy={isPending}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="release">Release date</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="critics">Critics score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-7">
        {isPending ? (
          <GameCardGridSkeleton />
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No games match these filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {items.map((game) => (
              <GameCard
                key={game.igdbId}
                game={game}
                listMembership={listMembershipByGame[game.igdbId]}
                isSaved={listMembershipByGame[game.igdbId]?.some(
                  (l) => l.checked,
                )}
              />
            ))}
          </div>
        )}
      </div>

      {hasMore && !isPending && (
        <div className="mt-12 flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loadMorePending}
            variant="outline"
            size="lg"
            aria-busy={loadMorePending}
          >
            {loadMorePending ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
