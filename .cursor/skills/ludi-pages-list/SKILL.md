---
name: ludi-pages-list
description: >-
  Single list page: full game queue, drag-to-reorder, remove items. Use when
  implementing /list/[listId] or See more from profile.
---

# Ludi — list detail page

Related skills: [ludi-pages-profile](../ludi-pages-profile/SKILL.md), [ludi-data-lists](../ludi-data-lists/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-auth](../ludi-auth/SKILL.md).

## Route

`/list/[listId]` — protected; RLS ensures `user_id` owns list.

404 if missing or not owner.

---

## Header

| Element | Spec |
|---------|------|
| Title | list `name` — **read-only** for system lists; editable for custom (see Rename) |
| Meta | `{count} games` · created date for custom lists |
| System list | badge “Default list” — no delete, **no rename** |
| Custom list | menu: **Rename**, Delete list (delete uses confirm dialog) |
| Back | link “← Profile” → `/profile#lists` |

### Custom list rename

- **Rename** in header menu → inline edit or modal; only when `is_system = false`.
- Persist `user_lists.name` via Server Action.
- System list titles: fixed; not editable on this page or profile.

---

## Queue UI

**Vertical reorderable list** (not horizontal scroll).

| Feature | Spec |
|---------|------|
| Item | GameCard `md` + drag handle + optional platform label from `list_items.platform_name` |
| Reorder | Drag-and-drop (e.g. `@dnd-kit/core`) — update `sort_order` on drop |
| Remove | Per-item “Remove” or X — see remove matrix below |
| Add games | Button “Add games” → `/search` or opens search modal v1.1 |

### Layout options

- **Grid queue:** cards in single column (mobile) or 2-col (desktop) with handle on left.
- On drag: lift shadow, `aria-grabbed`, keyboard sortable optional v1.1.

### Remove behavior

| List type | Remove UX | Data effect ([ludi-data-lists](../ludi-data-lists/SKILL.md)) |
|-----------|-----------|---------------------------------------------------------------|
| `currently_playing`, `want_to_play`, `games_played` | **Confirm dialog** then remove | Delete `list_items`; clear `user_game_status` (+ platform) if status matched |
| `games_rated` | Instant X (no confirm v1) | Delete `list_items` only; rating remains — optional note: “Your rating is still saved” |
| Custom | Instant X | Delete `list_items` only |

### Confirm dialog (status lists only)

Shown when user clicks Remove on a game in a status system list.

| Element | Spec |
|---------|------|
| Role | `alertdialog`, focus trap, ESC → Cancel |
| Title | `Are you sure?` |
| Default focus | Cancel |
| Actions | Cancel · **Remove** |

**Body copy** (include game name):

| `system_key` | Message |
|--------------|---------|
| `currently_playing` | This will remove **{name}** from Currently playing and clear your Playing status. |
| `want_to_play` | This will remove **{name}** from Want to play and clear your Want to play status. |
| `games_played` | This will remove **{name}** from Games played and clear your Played status. |

On confirm → call `removeListItem` Server Action → revalidate; game page hero shows **None** on next visit.

---

## Pagination / performance

- Load all items v1 if < 200; else virtualize v1.1.
- Batch IGDB for all `igdb_id`s in list (chunk 50).

---

## Empty state

Illustration + “This list is empty” + CTA to Search.

---

## Acceptance criteria

- [ ] Owner-only access.
- [ ] Shows all items ordered by `sort_order`.
- [ ] Drag reorder persists to DB.
- [ ] Status list remove shows confirm dialog with correct copy per list type.
- [ ] After confirmed status remove, `user_game_status` cleared and game page hero in sync.
- [ ] `games_rated` and custom removes are instant without confirm.
- [ ] System lists cannot be deleted or renamed.
- [ ] Custom list rename and delete (delete confirm) work.
- [ ] GameCards link to game page; save icon reflects saved state.

---

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Status remove | Confirm + clear play status |
| Custom / games_rated remove | Instant |
| Rename | Custom lists only on this page |

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | Full queue, DnD, remove |
| **v1.1** | Bulk add, keyboard reorder |
| **v2** | Share public read-only list |

---

## Open questions

1. Show drag on mobile long-press only?
