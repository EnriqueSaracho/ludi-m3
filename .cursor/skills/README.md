# Ludi — project skills (post-v1 reference)

Cursor Agent Skills for this repo. Each skill is a folder with a `SKILL.md` file.

**v1 is shipped.** Skills describe **as-built** behavior and regression expectations—not a greenfield build checklist. Ground truth when unsure: the repo (`src/`, `supabase/migrations/`).

## Skills index

| Skill folder | Scope |
|--------------|--------|
| `ludi-decisions/` | **Locked v1 decisions** — read first |
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

## Maintenance read order

1. **`ludi-decisions`** — scope contract (do not re-litigate v1 unless asked)
2. **`ludi-project`** — stack, routes, conventions
3. **Area skill** for the bug or feature you are touching (table above)

### By area (after decisions + project)

| Area | Skills |
|------|--------|
| Auth / session | `ludi-auth` |
| Lists / library | `ludi-data-lists` → `ludi-pages-profile` / `ludi-pages-list` |
| Game page | `ludi-data-game` → `ludi-pages-game` → `ludi-components-game-card` |
| Search | `ludi-data-search` → `ludi-pages-search` → `ludi-components-nav` → `ludi-components-game-card` |
| Home | `ludi-pages-home` → `ludi-data-lists` → `ludi-components-game-card` |
| Nav only | `ludi-components-nav` |

New product scope → update `ludi-decisions` (v1.1 backlog) before area skills.
