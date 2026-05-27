---
name: ludi-components-nav
description: >-
  Site nav: search submit, account menu, logout. Use when fixing header layout,
  search redirect to /search, or desktop username display.
---

# Ludi — navigation bar

> **Phase:** v1 shipped. Documents **current** `SiteNav` in root layout. Default work: search submit, auth menu, responsive layout—not typeahead ([v1.1](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-pages-search](../ludi-pages-search/SKILL.md), [ludi-auth](../ludi-auth/SKILL.md), [ludi-pages-profile](../ludi-pages-profile/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Implementation map

| Concern | Location |
|---------|----------|
| SiteNav | `src/components/nav/SiteNav.tsx` |
| Mounted in | `src/app/layout.tsx` |

## Purpose

Persistent header: brand, Home link, **global search**, **account control** (submenu or Login).

---

## Structure

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] Home          [ 🔍 Search........................ ]     │
│                          [Login]  OR  [@user Avatar ▾]  (md+: username)   │
└────────────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Logo | `/` |
| Home | `/` |
| Search | Submit → `/search?q=…` ([ludi-pages-search](../ludi-pages-search/SKILL.md)) |
| Guest | Single **Login** button → `/login?next={pathname}` |
| Authed | Avatar + **`profiles.username` on `md+`**; trigger opens dropdown |

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

## Regression checks

- [ ] Guest sees Login only (no dropdown).
- [ ] Authed sees avatar + four menu items + logout.
- [ ] **Username visible on desktop** (`md+`); truncated/hidden on mobile if cramped.
- [ ] Search behavior unchanged.
- [ ] My lists anchors to profile lists section.
- [ ] Logout clears session.

---

## Known gaps / deferred

Search typeahead in navbar → [ludi-decisions § v1.1](../ludi-decisions/SKILL.md#v11-backlog)

---

## Resolved

| Topic | Decision |
|-------|----------|
| Username beside avatar | **Yes on `md+`** ([ludi-decisions](../ludi-decisions/SKILL.md)) |
