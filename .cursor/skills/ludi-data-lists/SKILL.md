---
name: ludi-data-lists
description: >-
  Lists schema, play status sync, Server Actions, RLS. Use when fixing save
  button, status lists, reorder, profile bootstrap, or list limits.
---

# Ludi — lists & library data

> **Phase:** v1 shipped. Documents **current** schema and sync rules. Default work: list/status bugs, RLS, reorder—not collaborative or public lists ([v1.1](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-pages-profile](../ludi-pages-profile/SKILL.md), [ludi-pages-list](../ludi-pages-list/SKILL.md), [ludi-pages-game](../ludi-pages-game/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-auth](../ludi-auth/SKILL.md), [ludi-data-game](../ludi-data-game/SKILL.md).

## Implementation map

| Concern | Location |
|---------|----------|
| Server Actions | `src/lib/lists/actions.ts` |
| Queries (membership, previews) | `src/lib/lists/queries.ts` |
| Play status ↔ system list sync | `src/lib/lists/sync.ts` |
| Schema + RLS | `supabase/migrations/001_initial_schema.sql` |
| Add to list UI | `src/components/game-card/AddToListMenu.tsx` |
| List page reorder | `src/components/list/ListPageClient.tsx` |
| Profile lists | `src/components/profile/ProfileEditor.tsx`, `NewListDialog.tsx` |

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

**Independent per-status membership** — a game can be in any combination of the three status lists at once (e.g. `games_played` **and** `want_to_play`, for a replay). Each status is just a `list_items` row like any other list; there is no cross-list exclusivity:

| UI label | `play_status` value (label mapping only) | System list action |
|----------|-------------------|-------------------|
| Want to play | `want` | toggles membership in `want_to_play` only |
| Playing | `playing` | toggles membership in `currently_playing` only |
| Played | `played` | toggles membership in `games_played` only |

UI: game page hero renders the three as independent toggle buttons (`STATUS_OPTIONS` in `GamePageClient.tsx`), each checked/unchecked directly — same underlying `addToList`/`removeListItem` Server Actions used by `AddToListMenu`, which now treats status lists exactly like custom lists (no special-casing, direct uncheck allowed).

`user_game_status` (single row per `(user_id, igdb_id)`, singular `play_status` column) can no longer represent "current status" once multiple can be true — it is **not written to by the current UI** and is not read for status display. The table and its columns are left in place (untouched schema) rather than dropped.

### Platform / console

**UI removed (2026-08-18)** — the platform dropdown was confusing (unclear whether it meant played-on, want-to-play-on, or currently-playing-on). `GamePageClient.tsx` gates the `<Select>` behind `PLATFORM_SELECTOR_ENABLED = false`; the component, its state, and the `platforms` prop are still wired, just not rendered. DB columns (`list_items.platform_id/platform_name`, `user_game_status.platform_id/platform_name`) and `addToSystemList`'s optional `platform` param are unchanged, so re-enabling is a one-line flip plus reconnecting a setter — no data-layer work needed.

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
| `currently_playing`, `want_to_play`, `games_played` | delete | no change (unused, see above) | — | list page only ([ludi-pages-list](../ludi-pages-list/SKILL.md)) |
| `games_rated` | delete | no change | **keep** rating | none v1 |
| Custom | delete | no change | — | none v1 |

### AddToListMenu ([ludi-components-game-card](../ludi-components-game-card/SKILL.md))

- **Custom lists:** check = add, uncheck = instant remove (no confirm).
- **Status lists:** check = `addToList`, uncheck = `removeListItem` — behaves exactly like a custom list, fully independent of the other two status lists.
- **games_rated:** read-only when rated; remove via list page if needed.
- **Unsave:** menu item **Remove from all lists** when on any custom or status list — clears custom + status `list_items` and the (unused) `user_game_status` row; **keeps** `games_rated` + `game_ratings`.

Confirm dialog is **not** used in AddToListMenu.

---

## Filled bookmark icon

`isSaved(userId, igdbId)` = exists any `list_items` row for that user across **any** list (system or custom).

GameCard bookmark: **filled** when true, outline when false. Still opens AddToListMenu on click.

---

## Schema delivery

Iterate via **Supabase MCP** (`execute_sql`, `get_advisors`); commit `supabase/migrations/` when stable. See [ludi-decisions](../ludi-decisions/SKILL.md) and [ludi-project](../ludi-project/SKILL.md#supabase-schema-delivery).

---

## Supabase schema (sketch)

### `profiles` (extend)

| Column | Type |
|--------|------|
| id | uuid PK → auth.users |
| username | text (**non-unique v1**; UNIQUE constraint → v1.1) |
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
addToList(user, listId, igdbId):
  # status lists (want_to_play / currently_playing / games_played) are not
  # special-cased — same path as custom lists, so a game can be in any
  # combination of them simultaneously
  if count(list_items for listId) >= MAX_LIST_ITEMS: error
  else insert list_items on conflict do nothing

unsaveGame(user, igdbId):
  delete list_items from custom + status lists (not games_rated)
  delete user_game_status row (legacy cleanup only, see Play status above)

removeListItem(user, listId, igdbId):
  delete list_items where list_id and igdb_id
  # no cross-list side effects

rateGame(user, igdbId, score):
  upsert game_ratings
  add to games_rated list
```

**Shipped:** Server Actions in `src/lib/lists/actions.ts` with RLS. List-page remove calls `removeListItem` after user confirms (status lists only).

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

## Regression checks

- [ ] Signup creates profile with **derived username** (collisions allowed v1) + 4 system lists.
- [ ] A game can hold any combination of the three status lists at once (e.g. played + want to play, for a replay).
- [ ] Rating adds to games_rated.
- [ ] `isSaved` true if on any list.
- [ ] Custom lists CRUD works; custom lists renamable; system lists not renamable.
- [ ] sort_order reorder persists.
- [ ] `MAX_LIST_ITEMS` and `MAX_CUSTOM_LISTS` enforced with friendly errors.
- [ ] `games_rated` remove does not delete `game_ratings`.
- [ ] Platform selector stays hidden (`PLATFORM_SELECTOR_ENABLED = false` in `GamePageClient.tsx`).

---

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Rename | Custom only; system lists fixed |
| Max size | 10_000 items/list; 100 custom lists/user |
| Confirm dialog | List page only for status lists |
| AddToListMenu | Direct uncheck allowed on status lists (2026-08-18) |
| Multi status lists | **Yes** (2026-08-18) — independent per-status membership, no exclusivity |
| Platform selector | Hidden in UI (2026-08-18); DB columns + Server Action params kept dormant |

---

## Known gaps / deferred

Profile inline list rename, public share links, list covers, username UNIQUE → [ludi-decisions § v1.1](../ludi-decisions/SKILL.md#v11-backlog)

---

## Resolved (formerly open)

Rename, max size, status remove — unchanged. Username UNIQUE → v1.1 ([ludi-decisions](../ludi-decisions/SKILL.md)).
