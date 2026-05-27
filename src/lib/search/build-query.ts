import gameTypeIds from "@/lib/igdb/game-type-ids.json";

export type SearchParams = {
  q: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  platforms?: number[];
  genres?: number[];
  gameModes?: number[];
  quickFilter?: string;
};

const CARD_FIELDS = `id, name, slug, cover.image_id, first_release_date, game_type.type,
  rating, aggregated_rating, rating_count, aggregated_rating_count`;

export function buildIgdbSearchBody(params: SearchParams): string {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;
  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1;

  const clauses: string[] = [];
  const escaped = params.q.replace(/"/g, '\\"');
  clauses.push(`search "${escaped}";`);
  clauses.push(`fields ${CARD_FIELDS};`);

  const whereParts: string[] = [];

  const quick = params.quickFilter ?? "main";
  if (quick === "main") {
    const mainIds = (gameTypeIds as { main: number[] }).main;
    if (mainIds.length) {
      whereParts.push(`game_type = (${mainIds.join(",")})`);
    }
    whereParts.push("version_parent = null");
  } else if (quick === "bundles") {
    const ids = (gameTypeIds as { bundle: number[] }).bundle;
    if (ids.length) whereParts.push(`game_type = (${ids.join(",")})`);
  } else if (quick === "addons") {
    const ids = (gameTypeIds as { dlc: number[] }).dlc;
    if (ids.length) whereParts.push(`game_type = (${ids.join(",")})`);
  } else if (quick === "remakes") {
    const ids = (gameTypeIds as { remake: number[] }).remake;
    if (ids.length) whereParts.push(`game_type = (${ids.join(",")})`);
  } else if (quick === "mods") {
    const ids = (gameTypeIds as { mod: number[] }).mod;
    if (ids.length) whereParts.push(`game_type = (${ids.join(",")})`);
  }

  if (params.platforms?.length) {
    whereParts.push(`platforms = (${params.platforms.join(",")})`);
  }
  if (params.genres?.length) {
    whereParts.push(`genres = (${params.genres.join(",")})`);
  }
  if (params.gameModes?.length) {
    whereParts.push(`game_modes = (${params.gameModes.join(",")})`);
  }

  const sort = params.sort ?? "relevance";
  if (sort === "rating") {
    whereParts.push("rating != null");
  }

  if (whereParts.length) {
    clauses.push(`where ${whereParts.join(" & ")};`);
  }

  if (sort === "rating") {
    clauses.push("sort rating desc;");
  } else if (sort === "release") {
    clauses.push("sort first_release_date desc;");
  } else if (sort === "name") {
    clauses.push("sort name asc;");
  } else if (sort === "critics") {
    clauses.push("sort aggregated_rating desc;");
  }

  clauses.push(`limit ${limit}; offset ${offset};`);
  return clauses.join("\n");
}
