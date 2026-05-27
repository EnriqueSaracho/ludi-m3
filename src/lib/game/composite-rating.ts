export function compositeRating(game: {
  rating?: number | null;
  aggregated_rating?: number | null;
  rating_count?: number | null;
  aggregated_rating_count?: number | null;
}): number | null {
  const scores: number[] = [];

  if (
    game.rating != null &&
    game.rating_count != null &&
    game.rating_count > 0
  ) {
    scores.push(game.rating / 10);
  }

  if (
    game.aggregated_rating != null &&
    game.aggregated_rating_count != null &&
    game.aggregated_rating_count > 0
  ) {
    scores.push(game.aggregated_rating / 10);
  }

  if (scores.length === 0) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

export function formatReleaseDate(
  firstReleaseDate: number | null | undefined,
): string | null {
  if (!firstReleaseDate) return null;
  const date = new Date(firstReleaseDate * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
