/* IGDB sorts platforms alphabetically, which buries the ones anyone cares
   about under 1970s hardware. These float to the top, in order; anything
   else follows alphabetically. Shared between the platform facet
   (igdb/facets.ts) and the game page hero so priority stays consistent
   everywhere it's used. */
export const PLATFORM_PRIORITY = [
  "PC (Microsoft Windows)",
  "PlayStation 5",
  "Xbox Series X|S",
  "Nintendo Switch 2",
  "Nintendo Switch",
  "PlayStation 4",
  "Xbox One",
  "Mac",
  "Linux",
  "iOS",
  "Android",
  "PlayStation 3",
  "Xbox 360",
  "Nintendo 3DS",
  "Wii U",
  "Wii",
  "PlayStation Vita",
];

/** Official IGDB names are precise but wordy — fine in a filter list, too
 *  long for a hero chip. This is the short form anyone actually uses. */
const SHORT_NAMES: Record<string, string> = {
  "PC (Microsoft Windows)": "PC",
  "PlayStation 5": "PS5",
  "PlayStation 4": "PS4",
  "PlayStation 3": "PS3",
  "PlayStation 2": "PS2",
  PlayStation: "PS1",
  "PlayStation Vita": "PS Vita",
  "Xbox Series X|S": "Xbox Series",
  "Nintendo Switch 2": "Switch 2",
  "Nintendo Switch": "Switch",
  "Nintendo 3DS": "3DS",
  "Wii U": "Wii U",
};

export function sortPlatforms(names: string[]): string[] {
  const rank = (name: string) => {
    const i = PLATFORM_PRIORITY.indexOf(name);
    return i === -1 ? PLATFORM_PRIORITY.length : i;
  };
  return Array.from(new Set(names)).sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
}

export function shortPlatformName(name: string): string {
  return SHORT_NAMES[name] ?? name;
}
