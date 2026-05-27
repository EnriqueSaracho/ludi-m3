---
name: ludi-components-game-card
description: >-
  GameCard + AddToListMenu. Use when fixing card layout, save menu, rating
  pill, or list membership UX in grids and carousels.
---

# Ludi — GameCard component

> **Phase:** v1 shipped. Documents **current** `GameCard` / `AddToListMenu`. Default work: display bugs, save UX, event propagation—not price chip ([v1.1](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-data-game](../ludi-data-game/SKILL.md), [ludi-data-search](../ludi-data-search/SKILL.md), [ludi-pages-game](../ludi-pages-game/SKILL.md), [ludi-pages-search](../ludi-pages-search/SKILL.md), [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Implementation map

| Concern | Location |
|---------|----------|
| GameCard | `src/components/game-card/GameCard.tsx` |
| AddToListMenu | `src/components/game-card/AddToListMenu.tsx` |
| Payload type | `src/lib/game/types.ts` (`GameCardPayload`) |
| List actions | `src/lib/lists/actions.ts`, `queries.ts` |

## Purpose

Compact, linkable summary of a game for grids and horizontal rows. **One card component everywhere** — search, related content, recently visited.

## Route target

Primary link: **`/game/[igdbId]`** (v1).

---

## Props

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `game` | `GameCardPayload` | yes | From data layer |
| `href` | `string` | no | Default `/game/${game.igdbId}` |
| `priority` | `boolean` | no | Next/Image LCP |
| `size` | `'sm' \| 'md'` | no | default `md` |
| `showRating` | `boolean` | no | default `true` |
| `showSave` | `boolean` | no | default `true` |
| `className` | `string` | no | layout wrapper |

```ts
type GameCardPayload = {
  igdbId: number;
  slug: string;
  name: string;
  coverImageId: string | null;
  compositeRating: number | null; // 0-10, one decimal
  releaseDate: string | null;     // e.g. "Mar 12, 2024" or year only
  contentType: string | null;     // e.g. "Main Game", "DLC", "Bundle"
};
```

---

## Visual layout

```
┌─────────────────┐
│  ♥ (save)       │  top-start: save button (icon)
│                 │
│     cover       │  aspect-ratio 3/4
│        ┌──────┐ │
│        │8.4  │ │  top-end: rating pill (numeric, no star icon v1)
│        └──────┘ │
├─────────────────┤
│ Title (2 lines) │
│ DLC · 2024      │  content type · release (meta line)
└─────────────────┘
```

### Save control (bookmark, not heart)

Use **bookmark** icon (save to list semantics). `aria-label`: `Save to list` / `Saved` when filled.

| State | Icon |
|-------|------|
| Not on any list | outline bookmark |
| On ≥1 list (any) | **filled** bookmark |

`isSaved` = exists `list_items` for this user + `igdb_id` across all lists ([ludi-data-lists](../ludi-data-lists/SKILL.md)).

- Position: overlay top-start on cover, `z-10`.
- **Click:** `stopPropagation()` + `preventDefault()` — does not navigate to game page.
- **Guest:** redirect `/login?next={currentPath}` (same as game page).
- **Authed:** open **AddToListMenu** popover (shared with game page hero).

### Meta line

- `contentType` — muted text; hide segment if null.
- `releaseDate` — separator ` · ` between type and date; hide if null.
- Prefer year-only when exact date unknown (`first_release_date` missing).

### Rating badge

**Minimal numeric pill** (e.g. `8.4`) — no star icon v1. Composite 0–10, one decimal, [ludi-data-game](../ludi-data-game/SKILL.md) formula. Hide when null.

### Sizes

| Size | Width | Cover token |
|------|-------|-------------|
| `sm` | ~140px | `cover_small` |
| `md` | ~180px | `search grid`; min ~160px fluid |

---

## AddToListMenu (shared sub-component)

Extract to `AddToListMenu` used by GameCard and game hero. Data rules: [ludi-data-lists](../ludi-data-lists/SKILL.md).

| Prop | Notes |
|------|-------|
| `igdbId` | Game to add |
| `open`, `onOpenChange` | controlled from save button |
| `onListsChange`, `onPlayStatusChange` | optional — game page syncs list + status state |
| `anchorRef` | optional positioning |

### List rows in menu

| List kind | Check | Uncheck |
|-----------|-------|---------|
| **Custom** | Add `list_items` (respect `MAX_LIST_ITEMS`) | **Instant remove** — no confirm |
| **Status** (`currently_playing`, `want_to_play`, `games_played`) | Sets `play_status` via `addToList` → `setPlayStatus`; only one status list checked | **Disabled** when checked — use hero **None**, **Remove from all lists**, or list page Remove |
| **games_rated** | Auto when user rates | **Read-only** when present; remove on [list page](../ludi-pages-list/SKILL.md) if needed |

**Remove from all lists** (destructive menu item): shown when on custom or status list; calls `unsaveGame` — clears custom + status membership and play status; keeps `games_rated` if rated. `router.refresh()` after status add / unsave for grid bookmark state.

**No confirm dialog** in AddToListMenu. Status clears use list page Remove ([ludi-pages-list](../ludi-pages-list/SKILL.md)), hero **None**, or **Remove from all lists**.

Toast on add: “Added to {list name}”.

---

## Motion & a11y

- Card link: hover scale 1.03 (Framer Motion); reduced motion off.
- Save button: separate focus ring; must be keyboard reachable before/after title link in tab order (button before `<a>` wrap or use card structure: article > header actions + link body).
- **Recommended structure:**

```html
<article>
  <motion.a href="...">  <!-- cover + title + meta -->
  <button type="button" class="save">  <!-- sibling, not inside <a> -->
</article>
```

- `aria-label` on link: `{name}, {contentType}, released {releaseDate}, rated X out of 10`.

---

## Consumers

| Location | Layout | Save | Size |
|----------|--------|------|------|
| Search results | Responsive grid | yes | `md` |
| Game → Related | Horizontal row | yes | `md` |
| Game → What's next | Horizontal | yes | `sm` |
| Home (future) | TBD | yes | `md` |

---

## Data loading

Cards never fetch. Parents pass full `GameCardPayload[]`.

Search: [ludi-data-search](../ludi-data-search/SKILL.md). Game page related: Query C in [ludi-data-game](../ludi-data-game/SKILL.md) — extend fields `first_release_date`, `game_type.type`.

---

## Regression checks

- [ ] Cover, title, rating, release date, content type render correctly.
- [ ] Save opens list menu (authed) or login redirect (guest).
- [ ] Save click does not trigger navigation.
- [ ] Bookmark icon + accessible labels.
- [ ] Meta line handles partial data.
- [ ] Works in grid and horizontal scroll.
- [ ] Custom list check/uncheck works instantly.
- [ ] Status system lists cannot be unchecked from menu.
- [ ] No confirm dialog in AddToListMenu.

---

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Status list uncheck in menu | Not allowed v1 |
| Custom uncheck | Instant remove |
| Confirm | List page only for status remove |

---

## Known gaps / deferred

Lowest price chip, platform icons on card → [ludi-decisions § v1.1](../ludi-decisions/SKILL.md#v11-backlog)

---

## Resolved

| Topic | Decision |
|-------|----------|
| Rating badge style | **Numeric pill**, no star icon v1 ([ludi-decisions](../ludi-decisions/SKILL.md)) |
