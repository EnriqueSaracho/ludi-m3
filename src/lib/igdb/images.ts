export type IgdbImageSize =
  | "cover_small"
  | "cover_big"
  | "1080p"
  | "screenshot_med"
  | "screenshot_big";

export function igdbImageUrl(
  imageId: string | null | undefined,
  size: IgdbImageSize = "cover_big",
): string | null {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
