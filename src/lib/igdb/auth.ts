import { getEnv } from "@/lib/env";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getIgdbToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = getEnv("IGDB_CLIENT_ID");
  const clientSecret = getEnv("IGDB_CLIENT_SECRET");

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch IGDB token: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };

  cachedToken = data.access_token;
  const expiresIn = data.expires_in ?? 3600;
  tokenExpiresAt = now + (expiresIn - 300) * 1000;

  return cachedToken;
}

export function clearIgdbTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}
