---
name: ludi-data-lists
description: >-
  User lists, play status, platforms, system lists, list_items ordering.
  Supabase schema and sync rules. Use when implementing lists, save button,
  game page status, or profile library.
---

# Ludi — lists & library data

Related skills: [ludi-pages-profile](../ludi-pages-profile/SKILL.md), [ludi-pages-list](../ludi-pages-list/SKILL.md), [ludi-pages-game](../ludi-pages-game/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-auth](../ludi-auth/SKILL.md), [ludi-data-game](../ludi-data-game/SKILL.md).

## Concepts

| Concept | Description |
|---------|-------------|
| **System list** | Non-deletable, created on signup, fixed `system_key` |
| **Custom list** | User-created, renamable, deletable |
| **List item** | Game (`igdb_id`) in a list with `sort_order` + optional `platform` |
| **Play status** | User’s library state on game page — syncs to system lists |
| **Saved** | Game appears on ≥1 list (drives filled bookmark icon) |

---

## System lists (default, non-deletable)

| `system_key` | Display name | Population |
|--------------|--------------|------------|
| `currently_playing` | Currently playing | User sets status **Playing** on game page |
| `games_played` | Games played | User sets status **Played** |
| `want_to_play` | Want to play | User sets status **Want to play** |
| `games_rated` | Games rated | **Auto** when user submits rating on game page |

- `is_system = true`, `user_id`, `name` (display), `system_key` unique per user.
- **Cannot delete, rename `name`, or change `system_key`** — fixed display labels only.

**Ordering on profile:** system lists first (order above), then custom lists alphabetically or by `created_at`.

### Rename rules

| List kind | Rename `user_lists.name`? |
|-----------|---------------------------|
| System (4 defaults) | **No** — fixed labels on profile and list page |
| Custom | **Yes** — on list page v1 ([ludi-pages-list](../ludi-pages-list/SKILL.md)); profile inline rename v1.1 optional |

---

## Play status (game page)

Single **primary status** per user per game (mutually exclusive for system sync):

| UI label | `play_status` enum | System list action |
|----------|-------------------|-------------------|
| Want to play | `want` | add to `want_to_play`, remove from other status lists |
| Playing | `playing` | add to `currently_playing`, remove from others |
| Played | `played` | add to `games_played`, remove from others |
| None | `null` | remove from all three status lists (not from custom lists or `games_rated`) |

### Platform / console

When status is set, user selects **platform played on** (required if status non-null):

- Dropdown: IGDB `platforms` for that game (from cached game metadata) + “Other” optional.
- Store `platform_id` (IGDB platform id) + `platform_name` snapshot on `user_game_status`.

Changing platform updates row without changing status.

**UI placement:** game page hero — control group “Your status” beside Add to list.

---

## Custom lists

- CRUD via profile “New list” → `user_lists` insert `is_system=false`.
- **Rename:** update `name` via list page only (v1).
- Add game: AddToListMenu checkbox lists; insert `list_items` if not present (respect limits below).
- Remove: uncheck custom list in AddToListMenu (instant) or delete from list page (instant).
- Duplicate game in same list: prevented by unique `(list_id, igdb_id)`.

---

## Limits (v1)

| Constant | Value | Enforced on |
|----------|-------|-------------|
| `MAX_LIST_ITEMS` | **10_000** | `addToList`, `setPlayStatus` add, bulk add — per list (system or custom) |
| `MAX_CUSTOM_LISTS` | **100** | `createList` — per user (soft guardrail) |

Server Actions return a friendly error when exceeded, e.g. “This list is full (10,000 games max).” or “You can create up to 100 custom lists.”

---

## Remove from list

| List type | `list_items` | `user_game_status` | `game_ratings` | Confirm UI |
|-----------|--------------|-------------------|----------------|------------|
| `currently_playing`, `want_to_play`, `games_played` | delete | clear `play_status` + platform if status matched list | — | list page only ([ludi-pages-list](../ludi-pages-list/SKILL.md)) |
| `games_rated` | delete | no change | **keep** rating | none v1 |
| Custom | delete | no change | — | none v1 |

### AddToListMenu ([ludi-components-game-card](../ludi-components-game-card/SKILL.md))

- **Custom lists:** check = add, uncheck = instant remove (no confirm).
- **Status lists:** show checked when game is on list via play status; **do not allow uncheck** in v1 — user changes via game hero **None** / status select, or list page **Remove** with confirm.
- **games_rated:** read-only when rated; remove via list page if needed.

Confirm dialog is **not** used in AddToListMenu.

---

## Filled bookmark icon

`isSaved(userId, igdbId)` = exists any `list_items` row for that user across **any** list (system or custom).

GameCard bookmark: **filled** when true, outline when false. Still opens AddToListMenu on click.

---

## Supabase schema (sketch)

### `profiles` (extend)

| Column | Type |
|--------|------|
| id | uuid PK → auth.users |
| username | text unique |
| avatar_url | text nullable |
| preferred_country | char(2) nullable |
| created_at | timestamptz |

### `user_lists`

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK |
| name | text |
| is_system | boolean |
| system_key | text nullable unique per (user_id, system_key) |
| created_at | timestamptz |

### `list_items`

| Column | Type |
|--------|------|
| id | uuid PK |
| list_id | uuid FK → user_lists |
| igdb_id | integer |
| sort_order | integer (0-based, dense) |
| added_at | timestamptz |
| platform_id | integer nullable |
| platform_name | text nullable |

Unique: `(list_id, igdb_id)`.

### `user_game_status`

| Column | Type |
|--------|------|
| user_id | uuid |
| igdb_id | integer |
| play_status | text enum: want, playing, played |
| platform_id | integer nullable |
| platform_name | text nullable |
| updated_at | timestamptz |

PK: `(user_id, igdb_id)`.

### `game_ratings` (from game skill)

On upsert → ensure `list_items` row in `games_rated` system list.

---

## Sync logic (application)

```
setPlayStatus(user, igdbId, status, platform):
  upsert user_game_status
  remove igdbId from all system status lists (want/playing/played)
  if status: add to corresponding system list (append sort_order max+1)

addToList(user, listId, igdbId):
  if count(list_items for listId) >= MAX_LIST_ITEMS: error
  insert list_items on conflict do nothing

removeListItem(user, listId, igdbId):
  delete list_items where list_id and igdb_id
  if list.system_key in (currently_playing, want_to_play, games_played):
    if user_game_status.play_status matches that list:
      set play_status null, platform_id null, platform_name null

rateGame(user, igdbId, score):
  upsert game_ratings
  add to games_rated list
```

Implement via Server Actions with RLS. List-page remove calls `removeListItem` after user confirms (status lists only).

---

## RLS (summary)

- `user_lists`, `list_items`, `user_game_status`, `game_ratings`: owner `user_id = auth.uid()` CRUD.
- `profiles`: public read username/avatar; update own row.

---

## List page ordering

`list_items.sort_order` — reorder via drag-drop on [ludi-pages-list](../ludi-pages-list/SKILL.md):

- Batch update orders 0..n-1 on drop.
- Optimistic UI + server persist.

---

## Preview fetch (profile / home)

```
getListPreview(listId, limit = 6):
  select igdb_ids order by sort_order limit 6
  batch IGDB → GameCardPayload[]
```

---

## Acceptance criteria

- [ ] Signup creates 4 system lists.
- [ ] Play status syncs exactly one status list.
- [ ] Platform stored with status.
- [ ] Rating adds to games_rated.
- [ ] `isSaved` true if on any list.
- [ ] Custom lists CRUD works; custom lists renamable; system lists not renamable.
- [ ] sort_order reorder persists.
- [ ] `MAX_LIST_ITEMS` and `MAX_CUSTOM_LISTS` enforced with friendly errors.
- [ ] `removeListItem` clears `user_game_status` for status lists when matched.
- [ ] `games_rated` remove does not delete `game_ratings`.

---

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Rename | Custom only; system lists fixed |
| Max size | 10_000 items/list; 100 custom lists/user |
| Status list remove | Clears `play_status` + platform when matched |
| Confirm dialog | List page only for status lists |
| AddToListMenu | No uncheck on status lists v1 |
| Multi status lists | No — one status-driven list per game |

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | Full schema + sync |
| **v1.1** | List covers, public share links |
| **v2** | Collaborative lists |

---

## Open questions

None for rename, max size, or status remove.
