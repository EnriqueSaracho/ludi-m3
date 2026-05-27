---
name: ludi-auth
description: >-
  Supabase Auth: login, signup, reset, OAuth, middleware, verification gates.
  Use when fixing auth flows, protected routes, profile bootstrap, or email gates.
---

# Ludi — authentication

> **Phase:** v1 shipped. Documents **current** auth behavior. Default work: fix redirects, gates, bootstrap, or session bugs—not new auth methods (see [v1.1 backlog](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-components-nav](../ludi-components-nav/SKILL.md), [ludi-pages-profile](../ludi-pages-profile/SKILL.md), [ludi-data-lists](../ludi-data-lists/SKILL.md), [ludi-project](../ludi-project/SKILL.md).

## Implementation map

| Concern | Location |
|---------|----------|
| Login / signup / forgot | `src/app/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx` |
| OAuth + email confirm callback | `src/app/auth/callback/route.ts` |
| Reset password | `src/app/auth/reset-password/page.tsx` |
| Shared form UI | `src/components/auth/AuthForm.tsx` |
| Validation helpers | `src/lib/auth/validation.ts` |
| Session + route protection | `middleware.ts` → `src/lib/supabase/middleware.ts` |
| Legal pages | `src/app/terms/page.tsx`, `privacy/page.tsx` |

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

Default `next`: **login** → `/` (unless `next` param); **signup** → `/profile` (create profile row).

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
- **No username field** — `profiles.username` derived from email local-part on bootstrap ([ludi-decisions](../ludi-decisions/SKILL.md))
- Terms: single line below form — “By creating an account you agree to our [Terms](/terms) and [Privacy Policy](/privacy).” **No required checkbox.**
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
- `username` derived from email local-part (sanitize 3–24 chars, `[a-zA-Z0-9_]`); uniqueness not enforced v1
- `avatar_url` null
- `preferred_country` from cookie `ludi_country` if set

Provision **system lists** via [ludi-data-lists](../ludi-data-lists/SKILL.md).

---

## Logout

`signOut()` from nav menu → clear session → redirect `/`.

---

## Email verification gate (v1)

Required before **comment** or **rate** (see [ludi-pages-game](../ludi-pages-game/SKILL.md) community).

| Check | Detail |
|-------|--------|
| Server | Before `game_comments` insert / `game_ratings` upsert: user has `email_confirmed_at` set (Supabase Auth user). |
| UI | Authed but unverified: disabled slider/textarea + copy “Verify your email to comment or rate” + link to resend confirmation (`resend` pattern per Supabase docs). |
| Browse | Unverified users may still view game pages, search, lists. |

---

## Regression checks

- [ ] Email login/signup works with `next` redirect.
- [ ] Google OAuth round-trip works.
- [ ] Password reset flow complete.
- [ ] Middleware blocks profile/settings for guests.
- [ ] New user gets profile + system lists.
- [ ] No open redirect on `next`.
- [ ] Signup redirects to `/profile` by default.
- [ ] Username auto-derived; no signup username field.
- [ ] Terms line on signup (no checkbox).
- [ ] Unverified users cannot comment/rate (server + UI).

---

## Known gaps / deferred

- Magic link, Discord OAuth, DB-unique `profiles.username` → [ludi-decisions § v1.1](../ludi-decisions/SKILL.md#v11-backlog)

---

## Resolved

| Topic | Decision |
|-------|----------|
| Email before comment/rate | **Yes** — v1 ([ludi-decisions](../ludi-decisions/SKILL.md)) |
| Username unique at DB | **v1.1** — derive on signup v1 |
