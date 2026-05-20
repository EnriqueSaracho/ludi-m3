---
name: ludi-auth
description: >-
  Supabase Auth pages: login, signup, password reset, OAuth, session, middleware.
  Use when implementing /login, /signup, auth callbacks, or protected routes.
---

# Ludi — authentication

Related skills: [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-pages-profile](../ludi-pages-profile/SKILL.md), [ludi-data-lists](../ludi-data-lists/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Provider

**Supabase Auth** via `@supabase/ssr` — cookie sessions, middleware refresh.

### Enabled methods (v1)

| Method | Priority |
|--------|----------|
| Email + password | yes |
| Google OAuth | yes |
| Magic link | optional v1.1 |
| Discord OAuth | v1.1 |

---

## Routes (conventional)

| Path | Purpose |
|------|---------|
| `/login` | Sign in |
| `/signup` | Register |
| `/forgot-password` | Request reset email |
| `/auth/callback` | OAuth / email confirm handler (Supabase template) |
| `/auth/reset-password` | Set new password after email link |

No custom auth UX patterns — centered card on neutral background, logo on top, links between login ↔ signup.

---

## Query params

| Param | Use |
|-------|-----|
| `next` | Post-auth redirect (validate: same-origin path only, no open redirect) |
| `error` | OAuth error display |

Default `next`: `/` or `/profile` after first signup (create profile row).

---

## Page specs

### Login (`/login`)

- Email, password fields
- “Forgot password?” → `/forgot-password`
- Submit → `signInWithPassword`
- Google button → `signInWithOAuth({ provider: 'google' })`
- Footer: “Don’t have an account? Sign up”

### Signup (`/signup`)

- Email, password, confirm password (client validate match, min length 8)
- Username field → stored in `profiles.username` on success (see data-lists skill)
- Terms checkbox optional v1
- Submit → `signUp` + trigger profile creation (server action or DB trigger)
- Google sign-up same OAuth flow
- Footer: “Already have an account? Log in”

### Forgot password

- Email only → `resetPasswordForEmail` with redirect to `/auth/reset-password`

### Reset password

- New password + confirm → `updateUser`

### Forms

- Labels visible; errors from Supabase message (friendly map for common codes)
- Loading state on submit; disable double submit
- `autocomplete` attributes standard

---

## Middleware

Protect routes:

| Path | Rule |
|------|------|
| `/profile`, `/settings`, `/list/*` (owner) | require session |
| `/login`, `/signup` | redirect to `next` or `/` if already authed |

Public: `/`, `/search`, `/game/*`, `/list/{publicId}` — lists private by default (owner only).

---

## Profile bootstrap

On first `auth.users` insert → create `profiles` row:

- `id` = auth user id
- `username` from signup or derived from email prefix
- `avatar_url` null
- `preferred_country` from cookie `ludi_country` if set

Provision **system lists** via [ludi-data-lists](../ludi-data-lists/SKILL.md).

---

## Logout

`signOut()` from nav menu → clear session → redirect `/`.

---

## Acceptance criteria

- [ ] Email login/signup works with `next` redirect.
- [ ] Google OAuth round-trip works.
- [ ] Password reset flow complete.
- [ ] Middleware blocks profile/settings for guests.
- [ ] New user gets profile + system lists.
- [ ] No open redirect on `next`.

---

## Phasing

| Phase | Scope |
|-------|--------|
| **v1** | Email + Google, pages above |
| **v1.1** | Magic link, Discord |
| **v2** | Email verification gate for comments |

---

## Open questions

1. Require email verification before comment/rate?
2. Username uniqueness enforced at DB level?
