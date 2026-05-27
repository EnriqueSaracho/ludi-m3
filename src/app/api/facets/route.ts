import { NextResponse } from "next/server";
import { getGameModes, getGenres, getPlatforms } from "@/lib/igdb/facets";

export async function GET() {
  const [platforms, genres, gameModes] = await Promise.all([
    getPlatforms(),
    getGenres(),
    getGameModes(),
  ]);
  return NextResponse.json({ platforms, genres, gameModes });
}
