import { isSupportedCountry } from "@/lib/country/countries";

export const COUNTRY_COOKIE = "ludi_country";
export const COUNTRY_COOKIE_MAX_AGE = 31536000; // 1 year
export const DEFAULT_COUNTRY = "US";

/** Vercel resolves the client's country at the edge and exposes it here.
 *  `request.geo` was removed in Next 15, so the header is the supported path
 *  and it costs us no extra dependency. Vercel sends `XX` for unknown. */
const GEO_HEADERS = ["x-vercel-ip-country", "cf-ipcountry"];

/** Best-effort region from `Accept-Language`.
 *
 *  Scans every tag rather than trusting the first match: `zh-Hant-TW` makes the
 *  naive pattern yield `HA`, so candidates are validated against the supported
 *  list and the first real country wins. */
export function countryFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): string | null {
  if (!acceptLanguage) return null;
  for (const match of acceptLanguage.matchAll(/\b[a-z]{2}-([a-z]{2})\b/gi)) {
    const code = match[1].toUpperCase();
    if (isSupportedCountry(code)) return code;
  }
  return null;
}

/** Region for a request that has no `ludi_country` cookie yet. Geo header first
 *  (it reflects where the user actually is), then language, then US. */
export function detectCountry(headers: Headers): string {
  for (const header of GEO_HEADERS) {
    const value = headers.get(header);
    if (isSupportedCountry(value)) return value!.toUpperCase();
  }

  return (
    countryFromAcceptLanguage(headers.get("accept-language")) ?? DEFAULT_COUNTRY
  );
}
