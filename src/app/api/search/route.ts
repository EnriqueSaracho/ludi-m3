import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/search/search-games";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const sort = searchParams.get("sort") ?? undefined;
  const quickFilter = searchParams.get("quickFilter") ?? "main";
  const platforms = searchParams
    .get("platforms")
    ?.split(",")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const genres = searchParams
    .get("genres")
    ?.split(",")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const gameModes = searchParams
    .get("gameModes")
    ?.split(",")
    .map(Number)
    .filter((n) => !Number.isNaN(n));

  const result = await searchGames({
    q,
    page,
    sort,
    quickFilter,
    platforms,
    genres,
    gameModes,
  });

  return NextResponse.json(result);
}
