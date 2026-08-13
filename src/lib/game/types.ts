/** Bump whenever GameCardPayload's shape changes.
 *
 *  Cached IGDB responses are stored already normalised into GameCardPayload, so
 *  a shape change leaves old entries missing the new fields until their TTL
 *  expires (up to 24h). Including this in every cache key retires them at
 *  deploy time instead. */
export const CARD_PAYLOAD_VERSION = "v2";

export type GameCardPayload = {
  igdbId: number;
  slug: string;
  name: string;
  coverImageId: string | null;
  compositeRating: number | null;
  releaseDate: string | null;
  /** Year alone — what cards show, per the design. */
  releaseYear: string | null;
  contentType: string | null;
};

export type PlayStatus = "want" | "playing" | "played";

export type SystemListKey =
  | "currently_playing"
  | "games_played"
  | "want_to_play"
  | "games_rated";

export const MAX_LIST_ITEMS = 10_000;
export const MAX_CUSTOM_LISTS = 100;

/* `as const` keeps this narrower than SystemListKey: `games_rated` is a system
   list but not a play status, so it must stay out of the map below. */
export const STATUS_LIST_KEYS = [
  "currently_playing",
  "want_to_play",
  "games_played",
] as const satisfies readonly SystemListKey[];

/** The three system lists that mirror a play status (excludes `games_rated`). */
export type PlayStatusListKey = (typeof STATUS_LIST_KEYS)[number];

export function isPlayStatusListKey(
  key: string | null | undefined,
): key is PlayStatusListKey {
  return !!key && (STATUS_LIST_KEYS as readonly string[]).includes(key);
}

export const PLAY_STATUS_TO_LIST: Record<
  PlayStatus,
  SystemListKey
> = {
  playing: "currently_playing",
  played: "games_played",
  want: "want_to_play",
};

export const LIST_TO_PLAY_STATUS: Record<PlayStatusListKey, PlayStatus> = {
  currently_playing: "playing",
  want_to_play: "want",
  games_played: "played",
};
