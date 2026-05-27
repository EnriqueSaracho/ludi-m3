"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GameCard } from "@/components/game-card/GameCard";
import { GameCardGridSkeleton } from "@/components/loading/GameCardGridSkeleton";
import { useSearchShell } from "@/components/search/SearchShell";
import type { GameCardPayload } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUICK_FILTERS = [
  { key: "main", label: "Main games" },
  { key: "all", label: "All" },
  { key: "bundles", label: "Bundles" },
  { key: "addons", label: "Add-ons" },
  { key: "remakes", label: "Remakes & ports" },
  { key: "mods", label: "Mods" },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Quick filters">
        {QUICK_FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={
              (searchParams.get("quickFilter") ?? "main") === f.key
                ? "default"
                : "outline"
            }
            disabled={controlsDisabled}
            onClick={() => updateParam("quickFilter", f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm text-muted-foreground">Sort</label>
        <Select
          value={searchParams.get("sort") ?? "relevance"}
          onValueChange={(v) => updateParam("sort", v)}
          disabled={controlsDisabled}
        >
          <SelectTrigger className="w-40" aria-busy={isPending}>
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

      {isPending ? (
        <GameCardGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((game) => (
            <GameCard
              key={game.igdbId}
              game={game}
              listMembership={listMembershipByGame[game.igdbId]}
              isSaved={listMembershipByGame[game.igdbId]?.some((l) => l.checked)}
            />
          ))}
        </div>
      )}

      {hasMore && !isPending && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loadMorePending}
            variant="outline"
            aria-busy={loadMorePending}
          >
            {loadMorePending ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
