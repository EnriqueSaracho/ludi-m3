import { cookies } from "next/headers";

const DEFAULT_COUNTRY = "US";

export async function resolveCountry(
  preferredCountry?: string | null,
): Promise<string> {
  if (preferredCountry && preferredCountry.length === 2) {
    return preferredCountry.toUpperCase();
  }

  const cookieStore = await cookies();
  const cookieCountry = cookieStore.get("ludi_country")?.value;
  if (cookieCountry && cookieCountry.length === 2) {
    return cookieCountry.toUpperCase();
  }

  return DEFAULT_COUNTRY;
}

export function countryFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): string | null {
  if (!acceptLanguage) return null;
  const match = acceptLanguage.match(/[a-z]{2}-([A-Z]{2})/i);
  return match?.[1]?.toUpperCase() ?? null;
}
