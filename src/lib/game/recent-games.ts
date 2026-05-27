"use client";

const STORAGE_KEY = "ludi_recent_games";
const MAX_RECENT = 20;

export type RecentGame = {
  igdbId: number;
  name: string;
  coverImageId: string | null;
  visitedAt: number;
};

export function getRecentGames(): RecentGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentGame[];
  } catch {
    return [];
  }
}

export function addRecentGame(game: Omit<RecentGame, "visitedAt">) {
  const existing = getRecentGames().filter((g) => g.igdbId !== game.igdbId);
  const next: RecentGame[] = [
    { ...game, visitedAt: Date.now() },
    ...existing,
  ].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
