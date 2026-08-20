/** IGDB exposes a `_2x` render of every tier at exactly double the dimensions
 *  (`cover_big` 264x352 -> `cover_big_2x` 528x704). The 1x tiers are below what
 *  a DPR 2-3 phone needs, so anything that fills a box on mobile asks for `_2x`.
 *
 *  `t_original` is deliberately absent: it tracks whatever was uploaded, which
 *  is sometimes *smaller* than the fixed tier (one sampled artwork is 720x960
 *  original against 810x1080 at `1080p`), so it can't be relied on as an
 *  upgrade. */
export type IgdbImageSize =
  | "cover_small"
  | "cover_big"
  | "cover_big_2x"
  | "1080p"
  | "1080p_2x"
  | "screenshot_med"
  | "screenshot_big";

export function igdbImageUrl(
  imageId: string | null | undefined,
  size: IgdbImageSize = "cover_big",
): string | null {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
