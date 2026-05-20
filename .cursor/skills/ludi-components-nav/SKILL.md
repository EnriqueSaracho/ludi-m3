---
name: ludi-components-nav
description: >-
  Site navigation bar with global search and account menu (profile, lists,
  settings, logout) or Login. Use when implementing layout or header.
---

# Ludi — navigation bar

Related skills: [ludi-pages-search](../ludi-pages-search/SKILL.md), [ludi-auth](../ludi-auth/SKILL.md), [ludi-pages-profile](../ludi-pages-profile/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Purpose

Persistent header: brand, Home link, **global search**, **account control** (submenu or Login).

---

## Structure

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] Home          [ 🔍 Search........................ ]     │
│                                      [Login]  OR  [Avatar ▾]   │
└────────────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Logo | `/` |
| Home | `/` |
| Search | Submit → `/search?q=…` ([ludi-pages-search](../ludi-pages-search/SKILL.md)) |
| Guest | Single **Login** button → `/login?next={pathname}` |
| Authed | Avatar trigger opens dropdown |

Sticky optional; `z-50`, backdrop blur from tokens.

---

## Account dropdown (signed in)

Trigger: avatar image or initials circle. Menu items:

| Item | Action |
|------|--------|
| **My profile** | `/profile` |
| **My lists** | `/profile#lists` |
| **Settings** | `/settings` |
| — | separator |
| **Log out** | `signOut()` → `/` |

- `role="menu"`, items `role="menuitem"`.
- Keyboard: Enter/Space open, arrows navigate, ESC close.
- Click outside closes.

---

## Search field

| Behavior | Spec |
|----------|------|
| Placeholder | `Search games…` |
| Submit | Enter or button |
| Empty submit | no-op |
| Min length | 2 chars trimmed |
| On `/search` | reflect `q` in input; submit updates URL |

No typeahead v1. No results in navbar popover.

`<form role="search">` + sr-only label.

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Logo + avatar/login; search full-width row below or in menu sheet |
| `md+` | Inline search, max-w-md |

---

## Acceptance criteria

- [ ] Guest sees Login only (no dropdown).
- [ ] Authed sees avatar + four menu items + logout.
- [ ] Search behavior unchanged.
- [ ] My lists anchors to profile lists section.
- [ ] Logout clears session.

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | As spec |
| **v1.1** | Search typeahead |
| **v2** | Notifications bell |

---

## Open questions

1. Show username next to avatar on desktop?
