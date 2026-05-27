"use client";

import { useEffect, useState } from "react";
import { GameCard } from "@/components/game-card/GameCard";
import { getRecentGames } from "@/lib/game/recent-games";
import { toGameCardPayload } from "@/lib/game/normalize";

export function RecentGamesRow() {
  const [games, setGames] = useState<ReturnType<typeof getRecentGames>>([]);

  useEffect(() => {
    setGames(getRecentGames().slice(0, 8));
  }, []);

  if (games.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Recently viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {games.map((g) => (
          <GameCard
            key={g.igdbId}
            game={toGameCardPayload({
              id: g.igdbId,
              name: g.name,
              slug: String(g.igdbId),
              cover: g.coverImageId ? { image_id: g.coverImageId } : null,
            })}
            size="sm"
            showSave={false}
          />
        ))}
      </div>
    </section>
  );
}
