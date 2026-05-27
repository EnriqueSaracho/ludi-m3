export type GameCardPayload = {
  igdbId: number;
  slug: string;
  name: string;
  coverImageId: string | null;
  compositeRating: number | null;
  releaseDate: string | null;
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

export const STATUS_LIST_KEYS: SystemListKey[] = [
  "currently_playing",
  "want_to_play",
  "games_played",
];

export const PLAY_STATUS_TO_LIST: Record<
  PlayStatus,
  SystemListKey
> = {
  playing: "currently_playing",
  played: "games_played",
  want: "want_to_play",
};

export const LIST_TO_PLAY_STATUS: Record<
  (typeof STATUS_LIST_KEYS)[number],
  PlayStatus
> = {
  currently_playing: "playing",
  want_to_play: "want",
  games_played: "played",
};
