import { getEnv } from "@/lib/env";
import { clearIgdbTokenCache, getIgdbToken } from "@/lib/igdb/auth";

const IGDB_BASE = "https://api.igdb.com/v4";

export async function igdbFetch<T = unknown>(
  endpoint: string,
  body: string,
  retried = false,
): Promise<T> {
  const token = await getIgdbToken();
  const clientId = getEnv("IGDB_CLIENT_ID");

  const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body,
  });

  if (res.status === 401 && !retried) {
    clearIgdbTokenCache();
    return igdbFetch<T>(endpoint, body, true);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IGDB ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}
