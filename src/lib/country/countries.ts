/** Countries we offer for ITAD pricing.
 *
 *  ITAD prices by country and returns the matching currency per deal, so this
 *  list only has to name regions — it never hardcodes a currency. Kept in one
 *  place so the game-page picker and the settings picker cannot drift apart.
 *
 *  This list is an editorial choice, not a capability list: ITAD publishes no
 *  "supported countries" endpoint and accepts any ISO 3166-1 alpha-2 code,
 *  falling back to USD pricing where a region has no local currency (Mexico
 *  returns US prices in USD). Adding a code here is therefore always safe — the
 *  pricing section names the currency it got back, so a USD-billed region reads
 *  as such instead of looking like a discount.
 *
 *  Every code below is verified against Intl's ISO region data. Names are
 *  common-usage English and intentionally differ from CLDR's formal forms for
 *  two entries — "Hong Kong" (not "Hong Kong SAR China") and "Turkey" (not
 *  "Türkiye") — because those are what an English-speaking player scans for. */
export const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NO", name: "Norway" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function isSupportedCountry(code: string | null | undefined): boolean {
  return !!code && BY_CODE.has(code.toUpperCase());
}

export function countryName(code: string): string {
  return BY_CODE.get(code.toUpperCase())?.name ?? code;
}
