/**
 * One-time script: fetch IGDB game_types and write game-type-ids.json
 * Run: npx tsx scripts/generate-game-type-ids.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET");
  }

  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: "POST" },
  );
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const typesRes = await fetch("https://api.igdb.com/v4/game_types", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${access_token}`,
      Accept: "application/json",
    },
    body: "fields id, type; limit 50;",
  });

  const types = (await typesRes.json()) as { id: number; type: string }[];

  const byType = (labels: string[]) =>
    types.filter((t) => labels.includes(t.type)).map((t) => t.id);

  const output = {
    main: byType(["Main Game"]),
    dlc: byType([
      "DLC",
      "Addon",
      "Expansion",
      "Standalone Expansion",
      "Update",
      "Pack",
      "Episode",
      "Season",
    ]),
    bundle: byType(["Bundle"]),
    mod: byType(["Mod", "Fork"]),
    remake: byType(["Remake", "Remaster", "Port"]),
    edition: [],
    _raw: types,
  };

  const outPath = join(
    process.cwd(),
    "src/lib/igdb/game-type-ids.json",
  );
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch(console.error);
