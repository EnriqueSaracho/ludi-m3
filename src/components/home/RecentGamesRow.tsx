"use client";

import { useEffect, useState } from "react";
import { GameRow } from "@/components/game-card/GameRow";
import { getRecentGames } from "@/lib/game/recent-games";
import { toGameCardPayload } from "@/lib/game/normalize";

export function RecentGamesRow() {
  const [games, setGames] = useState<ReturnType<typeof getRecentGames>>([]);

  useEffect(() => {
    setGames(getRecentGames().slice(0, 10));
  }, []);

  if (games.length === 0) return null;

  return (
    <div>
      <h2 className="mb-5 text-xl font-light tracking-tight">Recently viewed</h2>
      <GameRow
        games={games.map((g) =>
          toGameCardPayload({
            id: g.igdbId,
            name: g.name,
            slug: String(g.igdbId),
            cover: g.coverImageId ? { image_id: g.coverImageId } : null,
          }),
        )}
      />
    </div>
  );
}
