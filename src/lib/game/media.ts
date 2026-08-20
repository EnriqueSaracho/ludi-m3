/** Media normalisation for the game page: turns IGDB's three unordered media
 *  arrays into one ranked rail plus the hero backdrop pick. */

export type IgdbVideo = { video_id?: string; name?: string };
export type IgdbScreenshot = { image_id?: string };
export type IgdbArtwork = { image_id?: string; artwork_type?: number };

export type MediaItem =
  | { kind: "video"; key: string; videoId: string; label: string }
  | { kind: "image"; key: string; imageId: string; label: string };

export type GameMedia = {
  /** Best key art, else best artwork, else the first screenshot. */
  backdropImageId: string | null;
  /** Rail order: videos (trailers first) → screenshots → artwork. */
  items: MediaItem[];
};

/** IGDB `/v4/artwork_types` ids. Small and stable, so they're inlined rather
 *  than fetched — see `scripts/generate-game-type-ids.ts` for the pattern used
 *  where a list is big enough to be worth generating. */
const ARTWORK_TYPE = {
  artwork: 1,
  keyArtNoLogo: 2,
  keyArtWithLogo: 3,
  conceptArt: 4,
  historicalArtwork: 15,
} as const;

/** Artwork worth showing, best first. Doubles as the backdrop preference: key
 *  art leads because it's the shot the publisher composed to sell the game.
 *  "Without logo" outranks "with logo" — the hero renders its own title, so
 *  burnt-in type would collide with the `h1`.
 *
 *  Types absent here are dropped from both the rail and the backdrop: game
 *  logos, icons, square/alternative/historical covers and infographics are
 *  assets, not media, and read as broken next to a screenshot. */
const ARTWORK_PRIORITY: readonly number[] = [
  ARTWORK_TYPE.keyArtNoLogo,
  ARTWORK_TYPE.keyArtWithLogo,
  ARTWORK_TYPE.artwork,
  ARTWORK_TYPE.historicalArtwork,
  ARTWORK_TYPE.conceptArt,
];

/** IGDB's own names ("Key art without logo") describe the asset, not what a
 *  visitor is looking at, so the rail labels them itself. */
const ARTWORK_LABEL: Record<number, string> = {
  [ARTWORK_TYPE.artwork]: "Artwork",
  [ARTWORK_TYPE.keyArtNoLogo]: "Key art",
  [ARTWORK_TYPE.keyArtWithLogo]: "Key art",
  [ARTWORK_TYPE.conceptArt]: "Concept art",
  [ARTWORK_TYPE.historicalArtwork]: "Artwork",
};

/** IGDB has no trailer flag — the only signal is the video's title. */
const TRAILER = /trailer|teaser|reveal|announce/i;

/** Older entries predate `artwork_type`; treat them as plain artwork so real
 *  art is never silently dropped. */
function artworkType(artwork: IgdbArtwork): number {
  return artwork.artwork_type ?? ARTWORK_TYPE.artwork;
}

/** Rank filters to the displayable types, then orders by ARTWORK_PRIORITY.
 *  `sort` is stable, so IGDB's order survives within each type. */
function rankArtworks(artworks: IgdbArtwork[] | undefined) {
  return (artworks ?? [])
    .filter(
      (a): a is IgdbArtwork & { image_id: string } =>
        !!a.image_id && ARTWORK_PRIORITY.includes(artworkType(a)),
    )
    .sort(
      (a, b) =>
        ARTWORK_PRIORITY.indexOf(artworkType(a)) -
        ARTWORK_PRIORITY.indexOf(artworkType(b)),
    );
}

/** Best key art, else best artwork, else the first screenshot. Shared by the
 *  game page hero and the home page carousel so both rank backdrops the same
 *  way. */
export function pickBackdropImageId(
  artworks: IgdbArtwork[] | undefined,
  screenshots: IgdbScreenshot[] | undefined,
): string | null {
  const ranked = rankArtworks(artworks);
  const screenshotIds = (screenshots ?? [])
    .map((s) => s.image_id)
    .filter((id): id is string => !!id);

  return ranked[0]?.image_id ?? screenshotIds[0] ?? null;
}

export function buildGameMedia(game: {
  videos?: IgdbVideo[];
  screenshots?: IgdbScreenshot[];
  artworks?: IgdbArtwork[];
}): GameMedia {
  const artworks = rankArtworks(game.artworks);
  const screenshotIds = (game.screenshots ?? [])
    .map((s) => s.image_id)
    .filter((id): id is string => !!id);

  const backdropImageId = pickBackdropImageId(game.artworks, game.screenshots);

  // Trailers lead the rail; IGDB's order holds within each group.
  const videos = (game.videos ?? [])
    .filter((v): v is IgdbVideo & { video_id: string } => !!v.video_id)
    .sort(
      (a, b) =>
        Number(TRAILER.test(b.name ?? "")) - Number(TRAILER.test(a.name ?? "")),
    )
    .map((v): MediaItem => ({
      kind: "video",
      key: `v-${v.video_id}`,
      videoId: v.video_id,
      label: v.name?.trim() || "Trailer",
    }));

  const images: Extract<MediaItem, { kind: "image" }>[] = [
    ...screenshotIds.map((id, i) => ({
      kind: "image" as const,
      key: `s-${id}`,
      imageId: id,
      label: `Screenshot ${i + 1}`,
    })),
    ...artworks.map((a) => ({
      kind: "image" as const,
      key: `a-${a.image_id}`,
      imageId: a.image_id,
      label: ARTWORK_LABEL[artworkType(a)] ?? "Artwork",
    })),
  ];

  // The backdrop stays in the rail: the hero crops it and lays a scrim and the
  // title over it, so the rail is the only place it can be seen whole.
  return { backdropImageId, items: [...videos, ...images] };
}

/** 4:3 with letterbox bars — cropping it to 16:9 removes exactly the bars.
 *  `maxresdefault` is truer but 404s on older uploads. */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}
