# Ludi — project skills (specs)

Cursor Agent Skills for this repo. Each skill is a folder with a `SKILL.md` file.

## Skills index

| Skill folder | Scope |
|--------------|--------|
| `ludi-project/` | Stack, conventions, design tokens, a11y, auth overview |
| `ludi-auth/` | Login, signup, reset, OAuth, middleware |
| `ludi-data-game/` | Game page: IGDB, ITAD, cache, normalization |
| `ludi-data-search/` | Search queries, filters, sort, facets |
| `ludi-data-lists/` | Lists, play status, Supabase schema, sync rules |
| `ludi-pages-home/` | Home / landing |
| `ludi-pages-game/` | Game detail page |
| `ludi-pages-search/` | Search results + empty state |
| `ludi-pages-profile/` | Profile, avatar, list previews |
| `ludi-pages-list/` | Single list queue + drag reorder |
| `ludi-components-game-card/` | GameCard + AddToListMenu |
| `ludi-components-nav/` | Navbar, search, account menu |

## Read order by feature

**Foundation:** `ludi-project` → `ludi-auth` → `ludi-data-lists`

**Game page:** `ludi-data-game` → `ludi-pages-game` → `ludi-components-game-card`

**Search:** `ludi-components-nav` → `ludi-data-search` → `ludi-pages-search` → `ludi-components-game-card`

**Home:** `ludi-pages-home` → `ludi-data-lists` → `ludi-components-game-card`

**Profile & lists:** `ludi-pages-profile` → `ludi-pages-list` → `ludi-data-lists`

Add folders as features are specified.
