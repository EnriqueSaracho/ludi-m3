import { cookies, headers } from "next/headers";
import { isSupportedCountry } from "@/lib/country/countries";
import {
  COUNTRY_COOKIE,
  DEFAULT_COUNTRY,
  detectCountry,
} from "@/lib/country/detect";

export { DEFAULT_COUNTRY };

/** Region used for ITAD pricing, most-specific signal first:
 *
 *  1. the signed-in user's saved preference,
 *  2. the `ludi_country` cookie (set by the proxy on first visit, or by either
 *     region picker),
 *  3. live detection from request headers — covers the first render of a brand
 *     new visit, before the proxy's cookie has made it back to us. */
export async function resolveCountry(
  preferredCountry?: string | null,
): Promise<string> {
  if (isSupportedCountry(preferredCountry)) {
    return preferredCountry!.toUpperCase();
  }

  const cookieStore = await cookies();
  const cookieCountry = cookieStore.get(COUNTRY_COOKIE)?.value;
  if (isSupportedCountry(cookieCountry)) {
    return cookieCountry!.toUpperCase();
  }

  return detectCountry(await headers());
}
