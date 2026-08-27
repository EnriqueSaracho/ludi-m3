import { getEnv } from "@/lib/env";
import { unstable_cache } from "next/cache";

const ITAD_BASE = "https://api.isthereanydeal.com";

async function itadFetch(path: string, init?: RequestInit) {
  const key = getEnv("ITAD_API_KEY");
  const url = `${ITAD_BASE}${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`ITAD ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function lookupItadGame(steamAppId: number): Promise<string | null> {
  const data = (await itadFetch(
    `/games/lookup/v1?appid=${steamAppId}`,
  )) as { found?: boolean; game?: { id?: string } };
  return data.game?.id ?? null;
}

export type ItadPriceDeal = {
  shop: { id: number; name: string };
  price: { amount: number; amountInt: number; currency: string };
  regular: { amount: number; amountInt: number; currency: string };
  url: string;
};

export async function fetchItadPrices(
  itadId: string,
  country: string,
): Promise<ItadPriceDeal[]> {
  const cached = unstable_cache(
    async () => {
      const data = (await itadFetch(`/games/prices/v3?country=${country}`, {
        method: "POST",
        body: JSON.stringify([itadId]),
      })) as Array<{ id: string; deals?: ItadPriceDeal[] }>;
      return data.find((entry) => entry.id === itadId)?.deals ?? [];
    },
    [`itad-prices-${itadId}-${country}`],
    { revalidate: 3600 },
  );
  return cached();
}

export function minCurrentPrice(
  deals: ItadPriceDeal[],
): { amount: number; currency: string } | null {
  if (deals.length === 0) return null;
  let min = deals[0];
  for (const d of deals) {
    if (d.price.amount < min.price.amount) min = d;
  }
  return { amount: min.price.amount, currency: min.price.currency };
}
