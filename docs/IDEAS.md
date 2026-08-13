# Ideas

Parking lot for post-v1 ideas. Nothing here is committed work — entries are here to be argued with, refined, or deleted. Add an entry when an idea is worth remembering, not when it's ready to build.

Status legend: **Raw** (just an idea) · **Shaped** (approach decided) · **Ready** (scoped enough to start) · **Dropped** (with a reason).

---

## Hardware-aware "Can I run this?"

**Status:** Raw
**Added:** 2026-08-13

### The idea

Today a game page shows a flat list of platforms. That answers "does this game exist on PC?" but not the question a user actually has: *"can **I** play this?"*

Let the user describe their hardware once on their profile — consoles they own, and their PC build (CPU, GPU, RAM, storage, OS) — then show a verdict on every game page:

- ✅ **You can play this** — on your Series X, or on your PC above recommended specs
- ⚠️ **Probably, at low settings** — meets minimum but not recommended
- ❌ **You can't play this** — no owned platform, or PC is under minimum
- ❓ **Not enough data** — no published requirements for this title

Console side is nearly free: it's a set-intersection between owned platforms and the game's platform list. The PC side is the hard, interesting part.

### Why it's worth doing

It turns a metadata list into a personal answer, and it's a feature Steam/IGDB don't give you across a whole library. It also compounds with the rest of Ludi: filter search by "playable on my hardware", sort a wishlist by "runs on what I own", warn before adding an unplayable game to a list.

### Data we'd need

**1. The user's hardware.** Two shapes, stored separately:

- *Consoles* — a multi-select against a controlled list of platforms. Easy; IGDB already gives us canonical platform IDs, so we can reuse them and the intersection is exact.
- *PC build* — free-ish text per component, resolved to canonical parts. Users will type "3070", "RTX 3070 Ti", "nvidia geforce rtx 3070", and a 12600K as "i5 12600k". This normalization is the real work.

Possible: let users paste DxDiag / `Get-ComputerInfo` output, or Steam's hardware survey blob, and parse it. Much more accurate than typed input, zero-install, and a nice power-user path.

**2. Game system requirements.** IGDB does **not** expose PC system requirements — worth confirming before designing around it. Steam's storefront API does, via `pc_requirements`, but it's an HTML blob of marketing prose, not structured fields, and wording is wildly inconsistent between publishers. We already carry `steam_appid` as the canonical cross-source link, so we can fetch it; parsing it is the problem. Consoles have no requirements to parse at all.

**3. A way to compare two GPUs/CPUs.** "Is an RX 6700 XT ≥ a GTX 1060?" needs a relative performance ordering. Options: a static benchmark table we curate (small, accurate, needs maintenance), a third-party benchmark API (accuracy vs. cost vs. ToS), or ask a model (flexible, fuzzy, needs caching).

### On the "hardware API"

Worth checking, but expect disappointment: there's no single well-maintained public API covering every console and every PC part with performance tiers attached. Realistic composition:

- **Consoles** — just IGDB platforms. Solved, no new dependency.
- **PC parts** — either a curated seed list of the ~300 GPUs and ~300 CPUs that cover the overwhelming majority of real builds, or a parts database API. A curated list we own is probably better: bounded, fast, no rate limits, and gets *more* accurate over time as we fix entries.
- **Requirements** — Steam, scraped and normalized at ingest time, not at page-view time.

### On the AI part

An LLM is a good fit for the messy parts and a bad fit for the verdict itself:

**Good uses**
- *Normalize requirements* — turn Steam's HTML prose into structured JSON (`{ gpu, cpu, ram_gb, storage_gb, os }`) for both minimum and recommended tiers. Run once per game at ingest, cache the result. Cheap and fully offline from the request path.
- *Resolve user input* — map "3070" or a pasted DxDiag dump to canonical part IDs.
- *Explain the verdict* — one sentence of "your GPU clears recommended, but you're 4 GB short on RAM."

**Bad use**
- *Computing the verdict live per page view.* Slow, costly, and non-deterministic — the same user on the same game could get different answers on refresh. Once requirements and hardware are both structured, the comparison is a lookup and a few integer comparisons. Keep AI at the edges (ingest and input parsing), keep the decision deterministic.

If we do use a model, Claude via the Anthropic API fits the extraction job; batch it at ingest, and cache aggressively keyed on the Steam appid + requirements hash so we only pay when a game's requirements actually change.

### Hard parts / open questions

- **Requirements text is unreliable.** Publishers write "GTX 970 or equivalent", list a CPU from 2013, or skip fields. Some titles have no requirements at all. The ❓ state has to be a first-class, non-embarrassing outcome, not a bug.
- **"Minimum specs" ≠ "good experience."** Meeting minimum often means 30fps at 720p low. A binary yes/no oversells our confidence — the ⚠️ tier and honest wording matter.
- **Laptop GPUs, iGPUs, handhelds.** A "RTX 4060 Laptop" is not a 4060. Steam Deck / ROG Ally are their own category with verified-status data available separately.
- **Maintenance.** A curated parts table is a thing someone has to keep current every GPU generation.
- **Privacy.** A hardware profile is fingerprint-adjacent. Keep it user-owned under RLS like the rest of our tables, private by default, and easy to delete.

### Smallest useful first slice

Console-only. Add owned platforms to the profile, intersect with the game's IGDB platform list, show a badge on the game page. No AI, no parsing, no new API — and it validates whether people actually fill in the hardware section at all before we invest in the PC pipeline.

---

<!-- Next idea goes here. Keep the same shape: what it is, why, what it needs, what's hard, smallest first slice. -->
