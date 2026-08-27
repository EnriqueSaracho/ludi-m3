import {
  siAppstore,
  siDiscord,
  siEpicgames,
  siFacebook,
  siFandom,
  siGogdotcom,
  siGoogleplay,
  siInstagram,
  siItchdotio,
  siPlaystation,
  siReddit,
  siSteam,
  siTwitch,
  siWikipedia,
  siX,
  siYoutube,
} from "simple-icons";

export type IgdbWebsite = { url?: string; type?: number };

export type BrandIconData = { path: string; hex: string };

export type SiteLink = {
  key: string;
  label: string;
  href: string;
  icon: BrandIconData | null;
};

/* IGDB's `website_type` enum. Undocumented gap at 7 (a removed category) is
   intentional, not a typo. 22/23/24 (Xbox/PlayStation/Nintendo storefronts)
   aren't in IGDB's public docs — confirmed empirically off a live payload
   (The Witcher 3, igdb id 1942). `external_games` looked like the obvious
   home for console stores but its entries carry no `url` for them; the
   websites array is the only place these links actually show up. */
const WEBSITE_TYPE = {
  OFFICIAL: 1,
  WIKIA: 2,
  WIKIPEDIA: 3,
  FACEBOOK: 4,
  TWITTER: 5,
  TWITCH: 6,
  INSTAGRAM: 8,
  YOUTUBE: 9,
  IPHONE: 10,
  IPAD: 11,
  ANDROID: 12,
  STEAM: 13,
  REDDIT: 14,
  ITCH: 15,
  EPICGAMES: 16,
  GOG: 17,
  DISCORD: 18,
  XBOX: 22,
  PLAYSTATION: 23,
  NINTENDO: 24,
} as const;

/* Storefronts: the "Available on" row. iphone/ipad both map to the App
   Store — IGDB lists them as separate types, but they're the same link.
   Xbox and Nintendo have no official mark in simple-icons, so those two
   render label-only rather than substituting an unofficial logo. */
const STORE_BY_TYPE: Partial<Record<number, { key: string; label: string; icon: BrandIconData | null }>> = {
  [WEBSITE_TYPE.STEAM]: { key: "steam", label: "Steam", icon: siSteam },
  [WEBSITE_TYPE.EPICGAMES]: { key: "epicgames", label: "Epic Games", icon: siEpicgames },
  [WEBSITE_TYPE.GOG]: { key: "gog", label: "GOG", icon: siGogdotcom },
  [WEBSITE_TYPE.ITCH]: { key: "itch", label: "itch.io", icon: siItchdotio },
  [WEBSITE_TYPE.ANDROID]: { key: "android", label: "Google Play", icon: siGoogleplay },
  [WEBSITE_TYPE.IPHONE]: { key: "ios", label: "App Store", icon: siAppstore },
  [WEBSITE_TYPE.IPAD]: { key: "ios", label: "App Store", icon: siAppstore },
  [WEBSITE_TYPE.PLAYSTATION]: { key: "playstation", label: "PlayStation Store", icon: siPlaystation },
  [WEBSITE_TYPE.XBOX]: { key: "xbox", label: "Xbox Store", icon: null },
  [WEBSITE_TYPE.NINTENDO]: { key: "nintendo", label: "Nintendo Store", icon: null },
};

/* Everything else: reference/community links, not places to buy. */
const REFERENCE_BY_TYPE: Partial<Record<number, { key: string; label: string; icon: BrandIconData | null }>> = {
  [WEBSITE_TYPE.OFFICIAL]: { key: "official", label: "Official Site", icon: null },
  [WEBSITE_TYPE.WIKIPEDIA]: { key: "wikipedia", label: "Wikipedia", icon: siWikipedia },
  [WEBSITE_TYPE.WIKIA]: { key: "wikia", label: "Wiki", icon: siFandom },
  [WEBSITE_TYPE.YOUTUBE]: { key: "youtube", label: "YouTube", icon: siYoutube },
  [WEBSITE_TYPE.TWITTER]: { key: "twitter", label: "X", icon: siX },
  [WEBSITE_TYPE.FACEBOOK]: { key: "facebook", label: "Facebook", icon: siFacebook },
  [WEBSITE_TYPE.INSTAGRAM]: { key: "instagram", label: "Instagram", icon: siInstagram },
  [WEBSITE_TYPE.TWITCH]: { key: "twitch", label: "Twitch", icon: siTwitch },
  [WEBSITE_TYPE.REDDIT]: { key: "reddit", label: "Reddit", icon: siReddit },
  [WEBSITE_TYPE.DISCORD]: { key: "discord", label: "Discord", icon: siDiscord },
};

/** Splits IGDB's `websites` array into storefronts ("Available on") and
 *  reference/community links ("Explore"). One row per distinct destination —
 *  iphone/ipad collapse into a single App Store entry. */
export function classifyWebsites(
  websites: IgdbWebsite[] | undefined,
): { stores: SiteLink[]; reference: SiteLink[] } {
  const stores = new Map<string, SiteLink>();
  const reference = new Map<string, SiteLink>();

  for (const site of websites ?? []) {
    if (!site.url || typeof site.type !== "number") continue;

    const store = STORE_BY_TYPE[site.type];
    if (store && !stores.has(store.key)) {
      stores.set(store.key, { ...store, href: site.url });
      continue;
    }

    const ref = REFERENCE_BY_TYPE[site.type];
    if (ref && !reference.has(ref.key)) {
      reference.set(ref.key, { ...ref, href: site.url });
    }
  }

  return { stores: [...stores.values()], reference: [...reference.values()] };
}
