---
name: ludi-pages-profile
description: >-
  Profile page: avatar, username, list previews with see more. Use when
  implementing /profile or user identity UI.
---

# Ludi — profile page

Related skills: [ludi-pages-list](../ludi-pages-list/SKILL.md), [ludi-data-lists](../ludi-data-lists/SKILL.md), [ludi-components-game-card](../ludi-components-game-card/SKILL.md), [ludi-auth](../ludi-auth/SKILL.md), [ludi-components-nav](../ludi-components-nav/SKILL.md).

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

Validation: username 3–24 chars, alphanumeric + underscore, unique.

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
| Title | list name + count badge `(12)` |
| Preview | horizontal row, **max 6** GameCards |
| Empty | “No games yet” + hint (e.g. “Mark a game as Playing from its page”) |
| CTA | **“See more”** → `/list/[listId]` |

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
- per list: `getListPreview(id, 6)` + total count

---

## Motion & a11y

- Avatar upload: progress + error announce `aria-live`.
- List sections `h2`; profile name `h1`.

---

## Acceptance criteria

- [ ] Avatar upload updates display.
- [ ] Username edit saves with uniqueness error handling.
- [ ] Four system list sections always visible.
- [ ] Custom lists appear below system lists.
- [ ] Each section shows ≤6 cards + See more → list page.
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

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | Identity + list previews + new list |
| **v1.1** | Public profile URL |
| **v2** | Activity feed, stats |

---

## Open questions

None for list rename rules.
