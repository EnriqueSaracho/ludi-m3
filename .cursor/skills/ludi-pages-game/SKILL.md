---
name: ludi-pages-game
description: >-
  Game page UI: six sections, sticky nav, community, related carousels.
  Use when fixing game page layout, anchors, verification gates, or section UX.
---

# Ludi — game page

> **Phase:** v1 shipped. Documents **current** `/game/[igdbId]` UI. Default work: section bugs, a11y, anchors, community gates—not Lenis or slug URLs ([v1.1](../ludi-decisions/SKILL.md#v11-backlog)).

See [ludi-decisions](../ludi-decisions/SKILL.md) for locked v1 scope.

Related skills: [ludi-data-game](../ludi-data-game/SKILL.md) (fetching, types), [ludi-data-lists](../ludi-data-lists/SKILL.md) (play status, lists), [ludi-components-game-card](../ludi-components-game-card/SKILL.md) (card rows), [ludi-project](../ludi-project/SKILL.md) (stack, tokens, auth), [ludi-auth](../ludi-auth/SKILL.md) (email verification).

## Implementation map

| Concern | Location |
|---------|----------|
| Server page + metadata | `src/app/game/[igdbId]/page.tsx` |
| Client sections (hero → what's next) | `src/components/game/GamePageClient.tsx` |
| Data loader | `src/lib/game/load-game-page.ts` |
| Recent games | `src/lib/game/recent-games.ts` |

## Route

| v1 | Value |
|----|--------|
| Path | `/game/[igdbId]` |
| Param | Numeric IGDB game id |
| Not found | 404 page if IGDB empty |

Future: `/game/[slug]` with redirect from slug → id once lookup table exists.

**SEO:** `generateMetadata` from `name`, `summary` (truncate ~160 chars), OG image from cover `image_id` (`t_cover_big`).

---

## Page structure (top → bottom)

```
[Sticky section nav — shipped]
1. Hero
2. Where to buy      (#where-to-buy)
3. About             (#about)
4. Community         (#community)
5. Related content   (#related)
6. What's next       (#whats-next)
```

Anchor IDs must match hero deep links (languages, accessibility, age ratings, buy).

---

## Global UX

| Concern | Spec |
|---------|------|
| Scroll | **Native scroll v1**; respect `prefers-reduced-motion` (disable heavy Framer motion). Lenis → v1.1. |
| Motion | Framer Motion scroll-reveal per section (`opacity` + `y`, once) |
| Loading | Route `src/app/game/[igdbId]/loading.tsx` hero skeleton; client pending on status/rate/comment; section `Suspense` → P2 polish |
| Partial failure | IGDB core required; ITAD/community can fail gracefully with inline message |
| Responsive | Mobile-first; hero stacks (cover + carousel above metadata on narrow) |
| Tokens | Colors/spacing from `src/styles/design-tokens.css` when it exists |

### Section nav (current behavior)

Horizontal pills: Buy · About · Community · Related · Next. Scroll-into-view on click. **Sticky** below main site nav on `md+`.

---

## 1. Hero (`#hero`)

### Layout (desktop)

Two columns: left = **static cover** (always visible) + **media carousel** beside/below it; right = title + metadata chips + actions. Cover is not duplicated inside the carousel.

### Elements

| UI | Data source | Notes |
|----|-------------|-------|
| Title | `games.name` | `h1` |
| Cover | `cover.image_id` | **Separate static** image (`t_cover_big`), distinct from carousel slides |
| Media carousel | `videos`, `screenshots`, `artworks` | See below |
| Platforms | `platforms.name` | Chips |
| Genres | `genres.name` | Chips |
| Developer | `involved_companies` developer=true | Primary names; link `#about-developers` |
| Publisher | `involved_companies` publisher=true | Link `#about-publishers` |
| Player modes | `game_modes` + `multiplayer_modes` | Derived labels: Single-player, Multiplayer, Co-op, etc. |
| Accessibility | — | Chip “Accessibility” → `#accessibility`; empty state in About |
| Languages | `language_supports` | “3 languages” or top 3 → `#about-languages` |
| Price | ITAD `lowestPrice` | Formatted `€19.99` or “—”; label “From” |
| Add to list | Supabase `user_lists` | Button → dropdown; auth required (see below) |
| Age rating | `primaryAgeRating` | Image thumb + org; link `#about-age-ratings` |
| Ratings | composite + optional breakdown | Large composite; tooltip/secondary: IGDB / Critics / Ludi |
| See options | — | Button → `#where-to-buy` smooth scroll |

### Media carousel

| Item type | Source | Render |
|-----------|--------|--------|
| Video | `game_videos.video_id` | YouTube embed or poster + play |
| Image | screenshots, artworks | IGDB image URL |

**Default slide:** first video if any; else first screenshot; else first artwork.

**Interaction:**

- Click slide → **lightbox** (~90vw × ~85vh), focus trap, ESC closes, return focus to slide.
- Carousel: prev/next arrows, swipe on touch, keyboard ←/→ when focused.
- `aria-roledescription="carousel"`, slides `aria-label="Media N of M"`.

**Reduced motion:** no slide transition animation; instant swap.

### Add to list

| User | Behavior |
|------|----------|
| Guest | Click → **redirect** `/login?next={currentPath}` |
| Authed | Popover: user lists + “Create list”; select adds `list_items` row |

Lists: [ludi-data-lists](../ludi-data-lists/SKILL.md). Bookmark on cards shows **filled** when game is on any list.

### Your library status (hero)

Authenticated control group — **“Your status”**:

| Control | Spec |
|---------|------|
| Status | Single select: **Want to play** · **Playing** · **Played** · None (clear) |
| Platform | Optional — dropdown of game’s IGDB `platforms` + “Other”; preserved when changing status without re-selecting |
| Sync | Updates `user_game_status` and moves game between system lists (see data-lists skill) |

| Status | System list |
|--------|-------------|
| Want to play | `want_to_play` |
| Playing | `currently_playing` |
| Played | `games_played` |

Guest: show disabled controls + “Sign in to track” → login redirect.

Placed adjacent to **Add to list** (distinct actions: status vs arbitrary lists).

### Sync with list page remove

| Action | Confirm? | Effect on hero |
|--------|----------|----------------|
| Hero **None** | No | Clears status + removes from status lists ([ludi-data-lists](../ludi-data-lists/SKILL.md)) |
| Remove on [list page](../ludi-pages-list/SKILL.md) (status list) | **Yes** — “Are you sure?” | Clears `user_game_status`; hero shows **None** on next load or revalidation |
| Uncheck status list in AddToListMenu | **Not allowed** when checked | — |
| **Remove from all lists** in AddToListMenu | No | Clears custom + status lists and `user_game_status`; keeps `games_rated` if rated |

Checking a status list in AddToListMenu sets hero status via `onPlayStatusChange`. After confirmed remove from a status list, game page status control must match (no stale Playing / Want to play / Played).

### Ratings display (hero)

- **Primary number:** composite 0–10 (one decimal), star visual.
- **Sources in composite:** IGDB user, critics, Ludi average — only non-null.
- **Do not** show `total_rating` separately if components used.
- Expandable “Rating details” (optional v1): three rows with source labels.

### Hero acceptance criteria

- [ ] Title, cover, carousel with video-first default.
- [ ] Lightbox a11y: focus trap, ESC, restored focus.
- [ ] All chips link to correct About anchors.
- [ ] Price shows lowest ITAD for region or “—”.
- [ ] Composite rating matches GameCard formula.
- [ ] “See options” scrolls to Where to buy.
- [ ] Add to list respects auth.
- [ ] Play status + platform saves and syncs system lists.
- [ ] List-page status remove and hero status stay in sync after revalidation.
- [ ] Submitting user rating adds game to **Games rated** list.
- [ ] Scroll-reveal on hero content; reduced motion honored.

---

## 2. Where to buy (`#where-to-buy`)

### Region selector

- Dropdown or combobox: ISO country codes (show country name).
- Default: **browser/geo hint** → cookie `ludi_country` → profile `preferred_country` when authed. Always **adjustable** on page (persists to cookie + profile).
- On change: refetch ITAD prices ([ludi-data-game](../ludi-data-game/SKILL.md)); update table + hero price client or server.

### ITAD price table

| Column | Source |
|--------|--------|
| Store | ITAD shop name + icon |
| Price | Current price, localized currency |
| Discount | % off if deal |
| DRM | If provided |
| Link | ITAD `url` verbatim (affiliate-safe) |

Sort: price ascending default. Highlight lowest row.

**Mobile:** ITAD rows as **stacked cards** (one store per card), not a horizontal table.

### Store links (non-ITAD or supplement)

Merge and dedupe:

- IGDB `websites` (steam, epicgames, gog, …)
- IGDB `external_games` with `url` (PlayStation Store, Xbox, Nintendo, etc.)

Display as icon button row or secondary table “Official stores” when no PC price.

### Empty states

| Case | Copy |
|------|------|
| No ITAD, has store URLs | “No PC deals tracked. Available on:” + icons |
| Nothing | “No store links available” |

### Regression checks

- [ ] Region change updates prices.
- [ ] Affiliate URLs unchanged.
- [ ] Console links visible when ITAD empty.
- [ ] Table accessible (`<table>` or grid with headers).

---

## 3. About (`#about`)

Long-form reference. Hide subsections with no data.

### Parent / edition banner

If `game_type` ≠ main game OR `parent_game` / `version_parent` set:

> **{game_type}** of [Parent Game Name](/game/{parentId})

Use `version_title` when present (e.g. “Gold Edition”).

### Subsections and anchors

| Anchor | Content | IGDB |
|--------|---------|------|
| `#about-developers` | Developers | involved_companies.developer |
| `#about-publishers` | Publishers | publisher flag |
| `#about-porting` | Porting developers | porting flag |
| `#about-supporting` | Supporting | supporting flag |
| `#about-genres` | Genres | genres |
| `#about-themes` | Themes | themes |
| `#about-modes` | Game modes | game_modes |
| `#about-perspectives` | Player perspectives | player_perspectives |
| `#about-franchise` | Franchise / series | franchise, franchises |
| `#about-engines` | Game engines | game_engines |
| `#about-releases` | Release dates | release_dates (platform, region, date) |
| `#about-ttb` | Time to beat | game_time_to_beats → h/min |
| `#about-localized` | Localized titles | game_localizations |
| `#about-alt-names` | Alternative titles | alternative_names |
| `#about-keywords` | Keywords | keywords |
| `#about-age-ratings` | All age ratings | age_ratings full list |
| `#about-languages` | Language matrix | language × support type table |
| `#accessibility` | Accessibility features | **v1 empty state** — “Coming soon” |
| `#about-summary` | Summary + storyline | summary, storyline |

**Spin-off:** no IGDB field — do not fabricate; franchise subsection covers series context.

### Language matrix

Rows = languages; columns = Audio / Subtitles / UI (from `language_support_type`).

### Regression checks

- [ ] Hero deep links scroll to anchors.
- [ ] Empty subsections not rendered.
- [ ] Time to beat formatted as hours/minutes.
- [ ] Parent game banner links correctly.
- [ ] Accessibility section exists with v1 placeholder.

---

## 4. Community (`#community`)

### Comments

- Thread list, newest first; paginate or “Load more”.
- Post form: textarea + submit (authed + **email verified** only).
- Guest: read-only + “Sign in to comment”.
- Unverified authed: disabled form + “Verify your email to comment or rate” + resend CTA ([ludi-auth](../ludi-auth/SKILL.md)).
- Schema: [ludi-data-game](../ludi-data-game/SKILL.md) `game_comments`.
- **Plain text only** in v1 (no markdown).
- Moderation: `deleted_at` hides; no edit v1 optional.

### Ratings

| UI | Source |
|----|--------|
| Your rating | **Slider** 0–10 (**step 0.5**), labels at ends; requires email verification |
| Ludi average | `avg(game_ratings.score)` |
| IGDB users | `rating` ÷ 10 |
| Critics | `aggregated_rating` ÷ 10 |

Guests see averages; cannot submit.

### Regression checks

- [ ] Auth + **email verification** gate on post/rate.
- [ ] Unverified users see verify CTA instead of submit/rate controls.
- [ ] Separate rows for Ludi / IGDB / Critics.
- [ ] User rating updates Ludi average and hero composite after refresh.

---

## 5. Related content (`#related`)

Horizontal **GameCard** rows per subsection ([ludi-components-game-card](../ludi-components-game-card/SKILL.md)), rendered in the fixed order below (`RELATED_SECTIONS` in `GamePageClient.tsx`, mirroring `RELATED_ORDER` in `load-game-page.ts`). Every row hides when empty **except Mods**.

| # | Subsection | Bucket | Source |
|---|------------|--------|--------|
| 1 | **Main game** | `parent` | `parent_game`, `version_parent` |
| 2 | Editions | `editions` | version children (reverse) |
| 3 | Expansions | `expansions` | `expansions` + `standalone_expansions` + Expansion/Standalone children |
| 4 | DLC | `dlcs` | `dlcs` + DLC children |
| 5 | Packs & add-ons | `packs` | Pack/Addon children (reverse) |
| 6 | Episodes | `episodes` | Episode children (reverse) |
| 7 | Seasons | `seasons` | Season children (reverse) |
| 8 | Updates | `updates` | Update children (reverse) |
| 9 | Bundles | `bundles` | `bundles` |
| 10 | Ports | `ports` | `ports` |
| 11 | Remakes | `remakes` | `remakes` |
| 12 | Remasters | `remasters` | `remasters` |
| 13 | Expanded games | `expanded` | `expanded_games` |
| 14 | Forks | `forks` | `forks` |
| 15 | Mods | `mods` | Mod children (reverse) + Nexus tile |
| 16 | Similar games | `similar` | `similar_games` |

**Ordering rationale:** the main game leads so a DLC / port / edition page can navigate **back** to its parent. Similar games trail everything — they are the only bucket that is not the same game.

**Main game row:** only renders when the current game is itself related content. Carries the `parent_game` card, plus the `version_parent` card when they differ.

**Mods row:** always rendered. `GameRow` takes a `leading` node — an `ExternalLinkCard` pointing at Nexus, in the same cover slot as the covers — followed by IGDB's mod children. No separate text link, no placeholder card when `related.mods` is empty.

**Nexus outbound link (static — not a data source):**

| Field | Value |
|-------|--------|
| Card | `ExternalLinkCard` — title “Nexus Mods”, subtitle “Search mods” |
| URL | `https://www.nexusmods.com/search/?BH%5Bsearch%5D={encodeURIComponent(name)}` where `name` is the current game display title |
| Link attrs | `target="_blank"`, `rel="noopener noreferrer"` |

No Nexus API, API key, or `nexus_game_map`.

### Regression checks

- [ ] Sections render in the table's order; all but Mods hide when empty.
- [ ] Main game row appears on a DLC / port / edition page and links back to the parent.
- [ ] Similar games is the **last** row on the page.
- [ ] Cards use batched payload from data layer; no card appears in two rows.
- [ ] Mods row shows the Nexus tile first, then IGDB mod games.
- [ ] Nexus link is a static search URL; opens in a new tab.

---

## 6. What's next (`#whats-next`)

### Recently visited

**Recommendation (v1):** `localStorage` key `ludi_recent_games` — JSON array of `{ igdbId, name, coverImageId, visitedAt }`, max 12, dedupe by id, newest first. Exclude current game.

v1.1: sync to Supabase for authed users cross-device.

### Similar games

Lives at the **bottom of Related content**, not here — see [§5](#5-related-content-related).

### Regression checks

- [ ] Recent list updates on page visit (client effect).
- [ ] Current game excluded from recent.

---

## Rating scale (project decision)

**Display scale: 0–10** (one decimal) everywhere — hero, community, GameCard. IGDB 0–100 divided by 10. Ludi DB stores 0–10.

---

## Auth interactions

| Feature | Guest | Authed |
|---------|-------|--------|
| View page | yes | yes |
| Comment | no | yes |
| Rate | no | yes |
| Add to list | redirect login | yes |

Use Supabase session from [ludi-project](../ludi-project/SKILL.md).

---

## Error states

| Error | UX |
|-------|-----|
| Invalid `igdbId` | 404 |
| IGDB down | Error boundary “Couldn’t load game” |
| ITAD fail | Hero price “—”; buy section message |
| Partial related | Show available carousels only |

---

## Known gaps / deferred

| Gap | Notes |
|-----|--------|
| Related “load more” | Rows hard-cap at 30 cards ([ludi-data-game](../ludi-data-game/SKILL.md)) |
| Recent games | `localStorage` only—not Supabase sync |
| Lenis, slug URLs | [v1.1 backlog](../ludi-decisions/SKILL.md#v11-backlog) |
| Framer scroll-reveal | Spec’d in sections below; not wired in `GamePageClient` yet (dependency only) |

---

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Region | Browser/geo → cookie → profile; adjustable; ITAD fallback US |
| Guest add to list | Redirect to login |
| User rating | 0–10 slider, **step 0.5** |
| Email verification | Required to comment/rate |
| Sticky section nav | **Required v1** |
| Scroll | Native v1; Lenis v1.1 |
| Comments | Plain text |
| Hero cover | Separate static cover + carousel |
| Mobile buy | Stacked cards |
| Mods | Nexus tile leads the row; IGDB mod children follow (Query F, shipped) |
| Related order | Main game first, similar games last |

---

## Page regression checks (summary)

- [ ] Route `/game/[igdbId]` renders all six sections.
- [ ] Metadata/OG tags from game name + summary + cover.
- [ ] Anchors work from hero.
- [ ] Sticky section pills scroll to anchors on `md+`.
- [ ] Framer Motion scroll-reveal per conventions; **native scroll** (no Lenis v1).
- [ ] WCAG: heading order h1→h2, carousel keyboard, contrast from tokens.
- [ ] Responsive hero and horizontal rows on mobile.
- [ ] GameCard used for related + similar + recent.
