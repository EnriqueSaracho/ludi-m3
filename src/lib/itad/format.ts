/** Fixed locale so the server and client render byte-identical strings — a
 *  request-derived locale here would hydrate-mismatch. `en-US` also renders the
 *  disambiguating prefix we want: `$39.99` for USD but `CA$55.99` for CAD, so a
 *  Canadian price can never be mistaken for an American one.
 *
 *  Intl also carries each currency's minor units, which a blanket `toFixed(2)`
 *  gets wrong — JPY is a whole-yen currency and formats as `¥5,588`. */
const FORMAT_LOCALE = "en-US";

export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(FORMAT_LOCALE, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    /* Intl throws on a malformed currency code rather than degrading. Showing
       the raw amount beside the code beats blanking the price row. */
    return `${amount.toFixed(2)} ${currency}`;
  }
}
