---
name: ludi-pages-profile
description: >-
  Profile UI: avatar, username, list previews, new list. Use when fixing
  /profile upload, username edit, or list preview rows.
---

# Ludi — profile page

> **Phase:** v1 shipped. Documents **current** owner-only `/profile`. Default work: avatar, username, list previews—not public profiles ([v1.1](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-pages-list](../ludi-pages-list/SKILL.md), [ludi-data-lists](../ludi-data-lists/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-auth](../ludi-auth/SKILL.md), [ludi-components-nav](../ludi-components-nav/SKILL.md).

## Implementation map

| Concern | Location |
|---------|----------|
| Profile route | `src/app/profile/page.tsx` |
| Editor + list sections | `src/components/profile/ProfileEditor.tsx` |
| New custom list | `src/components/profile/NewListDialog.tsx` |
| Settings (country, etc.) | `src/app/settings/page.tsx`, `src/components/settings/SettingsForm.tsx` |

## Route

`/profile` — protected ([ludi-auth](../ludi-auth/SKILL.md)).

Optional: `/profile/[username]` public profile v2 — **v1 is owner-only** (`/profile` = current user).

---

## Layout

### Header — identity

| Element | Spec |
|---------|------|
| Avatar | Circle, large; click or “Change photo” → file picker |
| Upload | Supabase Storage bucket `avatars` — max 2MB, jpg/png/webp; resize client or edge; update `profiles.avatar_url` |
| Username | Display + inline edit (save on blur or button) |
| Member since | optional subtle text from `created_at` |

Validation: username 3–24 chars, alphanumeric + underscore. **Unique not enforced v1** (collisions allowed; DB UNIQUE → v1.1).

### Section — My lists (`#lists`)

Intro line + **“New list”** button → modal: list name → create custom list.

#### System lists (fixed order)

1. Currently playing  
2. Games played  
3. Want to play  
4. Games rated  

**Names are not editable** on profile or list page — fixed labels only.

Each block:

| Part | Spec |
|------|------|
| Title | list name |
| Preview | horizontal row, **max 6** GameCards |
| Empty | “No games yet” + hint (e.g. “Mark a game as Playing from its page”), itself linking to `/list/[listId]` |
| CTA | `SeeAllCard` — cover-sized tail card at the end of the row (`+N`, total count) → `/list/[listId]`. Replaces the old header text link, which read as the list ending at the last cover. |

#### Custom lists (below system)

Same preview pattern. Empty custom list: “Add games from search or a game page.”

**Rename:** on list page v1 ([ludi-pages-list](../ludi-pages-list/SKILL.md)); inline rename on profile optional v1.1.

**Do not** render full lists on profile — length unbounded.

### Link to settings

Text link or button: “Account settings” → `/settings` (see below).

---

## Settings page (`/settings`)

Separate route (nav submenu item):

| Section | Fields |
|---------|--------|
| Account | email (read-only), change password |
| Preferences | `preferred_country` dropdown (region for prices) |
| Danger zone | delete account v2 |

v1 can be single page minimal; linked from profile + nav.

---

## Data

Server load:

- `profiles` row for user
- all `user_lists` ordered: system keys order, then custom `created_at`
- per list: `getListPreview(id, 6)` + `getListCount(id)` (feeds the tail card's `+N`)

---

## Motion & a11y

- Avatar upload: progress + error announce `aria-live`.
- List sections `h2`; profile name `h1`.

---

## Regression checks

- [ ] Avatar upload to `avatars` bucket works (max 2MB jpg/png/webp) and updates display.
- [ ] Username edit saves (format validation only v1; uniqueness → v1.1).
- [ ] Four system list sections always visible.
- [ ] Custom lists appear below system lists.
- [ ] Each section shows ≤6 cards + See all tail card → list page.
- [ ] New list creates custom list and appears in section.
- [ ] Guests cannot access `/profile`.
- [ ] System list titles are read-only everywhere.

---

## Resolved decisions

| Topic | Decision |
|-------|----------|
| System list rename | Not allowed |
| Custom list rename | List page v1 |

---

## Known gaps / deferred

Public `/profile/[username]`, inline list rename on profile → [ludi-decisions § v1.1](../ludi-decisions/SKILL.md#v11-backlog)

---

## Resolved

List rename rules unchanged. See [ludi-decisions](../ludi-decisions/SKILL.md) for avatars v1 and username uniqueness v1.1.
