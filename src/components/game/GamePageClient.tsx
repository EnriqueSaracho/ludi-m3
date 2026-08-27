"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Bookmark, Check, ChevronDown, ExternalLink, Globe, Star } from "lucide-react";
import { Spinner } from "@/components/loading/Spinner";
import { cn } from "@/lib/utils";
import { igdbImageUrl } from "@/lib/igdb/images";
import { addRecentGame } from "@/lib/game/recent-games";
import { GameRow } from "@/components/game-card/GameRow";
import { ExternalLinkCard } from "@/components/game-card/ExternalLinkCard";
import { MediaStrip } from "@/components/game/MediaStrip";
import {
  buildGameMedia,
  type IgdbArtwork,
  type IgdbScreenshot,
  type IgdbVideo,
} from "@/lib/game/media";
import { AddToListMenu } from "@/components/game-card/AddToListMenu";
import { RegionPicker } from "@/components/game/RegionPicker";
import { countryName } from "@/lib/country/countries";
import { formatPrice } from "@/lib/itad/format";
import { classifyWebsites, type IgdbWebsite } from "@/lib/game/websites";
import { BrandIcon } from "@/components/icons/BrandIcon";
import { Reveal } from "@/components/motion/Reveal";
import { addToList, postComment, rateGame, removeListItem } from "@/lib/lists/actions";
import type { GamePageData } from "@/lib/game/load-game-page";
import { PLAY_STATUS_TO_LIST, type PlayStatus } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Props = {
  data: GamePageData;
  igdbId: number;
  country: string;
  isAuthed: boolean;
  emailVerified: boolean;
  listMembership: Array<{
    id: string;
    name: string;
    system_key: string | null;
    is_system: boolean;
    checked: boolean;
  }>;
  platforms: string[];
};

/** Rendered in this order: the main game first so a DLC or edition page can
 *  navigate back to it, similar games last because they are the only bucket
 *  that is not the same game. Keys and order mirror RELATED_ORDER in
 *  src/lib/game/load-game-page.ts. Mods are pulled out of the loop — that row
 *  renders even when empty, to carry the Nexus tile. */
const RELATED_SECTIONS: Array<{ key: string; label: string }> = [
  { key: "parent", label: "Main game" },
  { key: "editions", label: "Editions" },
  { key: "expansions", label: "Expansions" },
  { key: "dlcs", label: "DLC" },
  { key: "packs", label: "Packs & add-ons" },
  { key: "episodes", label: "Episodes" },
  { key: "seasons", label: "Seasons" },
  { key: "updates", label: "Updates" },
  { key: "bundles", label: "Bundles" },
  { key: "ports", label: "Ports" },
  { key: "remakes", label: "Remakes" },
  { key: "remasters", label: "Remasters" },
  { key: "expanded", label: "Expanded games" },
  { key: "forks", label: "Forks" },
];

/** Independent status toggles — a game can carry any combination at once. */
const STATUS_OPTIONS: Array<{ value: PlayStatus; label: string }> = [
  { value: "want", label: "Want to play" },
  { value: "playing", label: "Playing" },
  { value: "played", label: "Played" },
];

/** Platform selection is disabled for now — the label was ambiguous (played
 *  on vs. want to play on vs. playing on). Storage/plumbing stays intact so
 *  this can be re-enabled without redoing the data layer. */
const PLATFORM_SELECTOR_ENABLED = false;

type IgdbGame = {
  name: string;
  summary?: string;
  storyline?: string;
  cover?: { image_id?: string };
  game_type?: { type?: string };
  rating?: number;
  aggregated_rating?: number;
  first_release_date?: number;
  genres?: Array<{ name?: string }>;
  involved_companies?: Array<{
    company?: { name?: string };
    developer?: boolean;
    publisher?: boolean;
  }>;
  screenshots?: IgdbScreenshot[];
  artworks?: IgdbArtwork[];
  videos?: IgdbVideo[];
  websites?: IgdbWebsite[];
};

export function GamePageClient({
  data,
  igdbId,
  country,
  isAuthed,
  emailVerified,
  listMembership,
  platforms,
}: Props) {
  const game = data.game as IgdbGame;

  /* A region almost always prices every shop in one currency, so naming it once
     in the header keeps the rows clean. It also defuses the cross-region trap:
     several countries (Mexico and much of LATAM) are billed in USD, and USD is
     the one currency Intl renders with a bare "$" — so a Canadian switching to
     Mexico sees CA$55.99 become $39.99 and reads it as a sale. The code beside
     the region changes at the same moment the numbers do.

     Mixed currencies in one region are rare but possible; then the header claim
     would be a lie, so the rows carry their own codes instead. */
  const priceCurrencies = Array.from(
    new Set(data.prices.map((d) => d.price.currency)),
  );
  const priceCurrency = priceCurrencies.length === 1 ? priceCurrencies[0] : null;

  const { stores, reference } = classifyWebsites(game.websites);

  const [menuOpen, setMenuOpen] = useState(false);
  const [lists, setLists] = useState(listMembership);
  const [platform, setPlatform] = useState<string>("");
  const [rating, setRating] = useState(data.userRating ?? 0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PlayStatus | null>(null);
  const [, startStatusTransition] = useTransition();
  const [ratePending, startRateTransition] = useTransition();
  const [commentPending, startCommentTransition] = useTransition();

  // Renders at 216px, so the 264px-wide `cover_big` falls short above DPR 1.
  const coverUrl = igdbImageUrl(game.cover?.image_id, "cover_big_2x");
  /* One pass ranks the artwork; the best of it becomes the backdrop and the
     rest falls into the rail behind the trailers and screenshots. */
  const media = buildGameMedia(game);
  const backdropUrl = igdbImageUrl(media.backdropImageId, "1080p_2x");
  const savedCount = lists.filter((l) => l.checked).length;
  const isSaved = savedCount > 0;
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getUTCFullYear()
    : null;
  /* Publishers and porting houses share `involved_companies`, so the developer
     flag is the only thing that marks an author. IGDB also repeats a studio per
     region, hence the dedupe. Two names is the ceiling — past that the byline
     stops being a credit and turns into a credits roll. */
  const developers = Array.from(
    new Set(
      (game.involved_companies ?? [])
        .filter((c) => c.developer)
        .map((c) => c.company?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ).slice(0, 2);

  useEffect(() => {
    setLists(listMembership);
  }, [listMembership]);

  useEffect(() => {
    addRecentGame({
      igdbId,
      name: game.name,
      coverImageId: game.cover?.image_id ?? null,
    });
  }, [igdbId, game.name, game.cover?.image_id]);

  function toggleStatus(value: PlayStatus) {
    if (!isAuthed || pendingStatus) return;

    const listKey = PLAY_STATUS_TO_LIST[value];
    const list = lists.find((l) => l.system_key === listKey);
    if (!list) return;

    const checked = !list.checked;
    const previous = lists;
    setLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, checked } : l)),
    );
    setPendingStatus(value);
    setError(null);

    startStatusTransition(async () => {
      try {
        if (checked) {
          await addToList(list.id, igdbId);
        } else {
          await removeListItem(list.id, igdbId);
        }
      } catch (e) {
        setLists(previous);
        setError(e instanceof Error ? e.message : "Failed to update status");
      } finally {
        setPendingStatus(null);
      }
    });
  }

  function handleRate() {
    if (!emailVerified || ratePending) return;
    startRateTransition(async () => {
      try {
        await rateGame(igdbId, rating);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to rate");
      }
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!emailVerified || commentPending) return;
    const body = comment;
    startCommentTransition(async () => {
      try {
        await postComment(igdbId, body);
        setComment("");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post");
      }
    });
  }

  return (
    <article>
      {/* Hero: wide art with the whole title block seated in the bottom-left,
          where the scrim guarantees dark ground under white type.

          The hairline rule is a baseline, not a divider: studio and title stack
          on top of it as a masthead, and everything below it is metadata —
          year, type, genre, scores. Nothing goes between the title and the
          rule; the title's contact with it is what holds the block together. */}
      <header className="grain relative isolate flex h-[80vh] max-h-[52rem] min-h-[32rem] w-full flex-col justify-end overflow-hidden bg-void">
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt=""
            fill
            /* Unambiguously the LCP here — one full-bleed image, no carousel.
               `preload` replaces the deprecated `priority` in Next 16. */
            preload
            quality={60}
            /* Inflated on mobile for the same reason as the home hero — see the
               note in HomeHero.tsx. This box is taller (80vh), so the crop is
               slightly harsher still. */
            sizes="(max-width: 768px) 300vw, 100vw"
            className="-z-10 object-cover object-center"
          />
        )}
        <div className="scrim-b pointer-events-none absolute inset-0 -z-10" />
        {/* Insurance for art that stays bright down in the bottom-left. */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-void/70 via-void/15 to-transparent" />

        <div className="shell-wide pb-10 md:pb-12">
          {/* The imprint. Caps and tracked-out is the right register *here*
              specifically — above a title it reads as authorship, the way a
              label sits above a record. The same string set below the rule
              would read as one more filter facet. */}
          {developers.length > 0 && (
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-white/60">
              {developers.join(" · ")}
            </p>
          )}
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-light leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_16px_rgb(0_0_0/0.7)] md:text-5xl lg:text-[3.25rem]">
            {game.name}
          </h1>

          <div className="mt-7 h-px w-full bg-white/15" />

          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              {/* Year and type are facets, same class of thing as genre, so
                  they belong with the chips rather than up in the imprint.
                  Left unboxed: a bordered "2015" would read as clickable. */}
              {(releaseYear || game.game_type?.type) && (
                <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-white/45">
                  {[releaseYear, game.game_type?.type].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {game.genres?.slice(0, 4).map((g) => (
                  <span
                    key={g.name}
                    className="rounded-sm border border-white/20 px-2 py-1 text-[0.6875rem] uppercase tracking-wider text-white/70"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-8">
              <ScoreStat
                label="Ludi"
                value={
                  data.ludiAvgRating != null ? data.ludiAvgRating.toFixed(1) : "N/A"
                }
                icon
              />
              <ScoreStat
                label="Critics"
                value={
                  game.aggregated_rating != null
                    ? String(Math.round(game.aggregated_rating))
                    : "N/A"
                }
                boxed
              />
            </div>
          </div>
        </div>
      </header>

      <MediaStrip items={media.items} gameName={game.name} />

      {/* About: cover and personal controls on the left, prose centred right. */}
      <section id="about" className="shell scroll-mt-20 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[13.5rem_1fr] md:gap-16">
          <div className="mx-auto w-full max-w-[13.5rem] md:mx-0">
            <div className="sticky top-20 space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-sunken ring-1 ring-white/10 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9)]">
                {coverUrl && (
                  <Image
                    src={coverUrl}
                    alt=""
                    fill
                    sizes="216px"
                    className="object-cover"
                  />
                )}
              </div>

              {isAuthed ? (
                <div className="space-y-3">
                  {/* Save is the one filled control in the column; the status
                      ladder below it stays quiet so the hierarchy reads at a
                      glance. */}
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    className={cn(
                      "h-11 w-full justify-start gap-2.5 px-3.5",
                      isSaved &&
                        "shadow-[0_14px_34px_-16px_var(--accent)] ring-1 ring-inset ring-white/15",
                    )}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(true)}
                  >
                    <Bookmark
                      className={isSaved ? "fill-current" : undefined}
                      strokeWidth={1.5}
                    />
                    <span>{isSaved ? "Saved" : "Save to list"}</span>
                    {isSaved && (
                      <span className="ml-auto text-[0.6875rem] tabular-nums text-white/55">
                        {savedCount}
                      </span>
                    )}
                    <ChevronDown
                      strokeWidth={1.5}
                      className={cn(
                        "shrink-0 opacity-50 transition-transform duration-200",
                        isSaved ? "ml-1.5" : "ml-auto",
                        menuOpen && "rotate-180",
                      )}
                    />
                  </Button>
                  <AddToListMenu
                    igdbId={igdbId}
                    lists={lists}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    onListsChange={setLists}
                  />

                  {/* Status ladder. One well, three rows — the labels never get
                      squeezed the way three side-by-side pills did, and an
                      accent rail marks the active ones down the left edge. */}
                  <div className="overflow-hidden rounded-md border border-hairline bg-sunken/60">
                    {STATUS_OPTIONS.map(({ value, label }, i) => {
                      const checked = lists.some(
                        (l) =>
                          l.system_key === PLAY_STATUS_TO_LIST[value] &&
                          l.checked,
                      );
                      const isPending = pendingStatus === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={checked}
                          disabled={isPending}
                          onClick={() => toggleStatus(value)}
                          className={cn(
                            "group relative flex w-full cursor-pointer items-center gap-3 py-2.5 pl-4 pr-3 text-left text-[0.8125rem] transition-colors duration-200 disabled:cursor-not-allowed",
                            i > 0 && "border-t border-hairline",
                            checked
                              ? "bg-brand/[0.09] font-medium text-white"
                              : "text-copy hover:bg-raised/50 hover:text-white",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute inset-y-0 left-0 w-[2px] origin-center bg-brand transition-transform duration-300 ease-out",
                              checked ? "scale-y-100" : "scale-y-0",
                            )}
                          />
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors duration-200",
                              checked
                                ? "border-brand bg-brand"
                                : "border-hairline-strong group-hover:border-brand-tint/50",
                            )}
                          >
                            {isPending ? (
                              <Spinner
                                size="sm"
                                className="h-3 w-3 text-current"
                              />
                            ) : (
                              <Check
                                strokeWidth={3}
                                className={cn(
                                  "h-3 w-3 text-white transition-transform duration-200",
                                  checked ? "scale-100" : "scale-0",
                                )}
                              />
                            )}
                          </span>
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {PLATFORM_SELECTOR_ENABLED && (
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : (
                <Button asChild className="h-11 w-full gap-2.5">
                  <Link href={`/login?next=/game/${igdbId}`}>
                    <Bookmark strokeWidth={1.5} />
                    Sign in to save
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="min-w-0">
            {game.summary && (
              <Reveal className="text-center">
                <h2 className="text-2xl font-light tracking-tight">Summary</h2>
                <p className="mx-auto mt-5 max-w-2xl text-[0.8125rem] leading-[1.85] text-copy">
                  {game.summary}
                </p>
              </Reveal>
            )}

            {game.storyline && (
              <Reveal className="mt-12 text-center">
                <div className="mx-auto mb-12 h-px w-full max-w-md bg-hairline" />
                <h2 className="text-2xl font-light tracking-tight">Storyline</h2>
                <p className="mx-auto mt-5 max-w-2xl text-[0.8125rem] leading-[1.85] text-copy">
                  {game.storyline}
                </p>
              </Reveal>
            )}

            {!game.summary && !game.storyline && (
              <p className="text-center text-muted-foreground">
                No description available for this game.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Get the Game */}
      <section id="buy" className="scroll-mt-20 border-y border-hairline bg-void py-16">
        <div className="shell">
          <Reveal>
            <h2 className="text-center text-2xl font-light tracking-tight">
              Get the Game
            </h2>
            {/* The picker doubles as the region label — a separate "PC prices
                for Mexico" line would just restate whatever it already shows. */}
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[0.8125rem] text-muted-foreground">
              <span>PC prices for</span>
              <RegionPicker country={country} isAuthed={isAuthed} />
              {priceCurrency && (
                <>
                  <span aria-hidden className="text-hairline">
                    &middot;
                  </span>
                  <span
                    className="font-medium tracking-[0.09em] text-copy"
                    title={`Prices shown in ${priceCurrency}`}
                  >
                    {priceCurrency}
                  </span>
                </>
              )}
            </p>

            {data.prices.length === 0 ? (
              <div className="mx-auto mt-10 max-w-2xl rounded-md border border-dashed border-hairline px-6 py-10 text-center">
                <p className="text-[0.9375rem] text-copy">
                  No PC prices listed for {countryName(country)}.
                </p>
                <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
                  This game may not be sold in that region — try another above.
                </p>
              </div>
            ) : (
              <ul className="mx-auto mt-10 max-w-2xl divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-elevated">
                {data.prices.map((deal, i) => (
                  <li key={i}>
                    <a
                      href={deal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-raised"
                    >
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        {deal.shop.name}
                        <ExternalLink
                          className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-brand-tint"
                          strokeWidth={1.5}
                        />
                      </span>
                      <span className="text-sm font-medium tabular-nums text-brand-tint">
                        {formatPrice(deal.price.amount, deal.price.currency)}
                        {!priceCurrency && (
                          <span className="ml-1.5 text-[0.6875rem] font-normal tracking-[0.09em] text-muted-foreground">
                            {deal.price.currency}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {data.itadSlug && (
              <p className="mx-auto mt-4 max-w-2xl text-center">
                <a
                  href={`https://isthereanydeal.com/game/${data.itadSlug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground transition-colors hover:text-brand-tint"
                >
                  Full price history on IsThereAnyDeal
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                </a>
              </p>
            )}

            {/* Available on: storefronts from IGDB's `websites` array. Shown
                even when ITAD has no PC price, since a store link is still
                useful. Xbox and Nintendo have no logo — simple-icons
                excludes both under its "forbidden brands" policy — so those
                two render their name as text instead. */}
            {stores.length > 0 && (
              <div className="mx-auto mt-12 max-w-2xl">
                <p className="text-center text-[0.6875rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Available on
                </p>
                <ul className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {stores.map((store) => (
                    <li key={store.key}>
                      <a
                        href={store.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={store.label}
                        title={store.label}
                        className="group flex h-14 min-w-14 items-center justify-center rounded-md border border-hairline bg-elevated px-4 text-copy transition-colors hover:border-hairline-strong hover:bg-raised"
                        style={
                          store.icon
                            ? ({ "--brand-hex": `#${store.icon.hex}` } as React.CSSProperties)
                            : undefined
                        }
                      >
                        {store.icon ? (
                          <BrandIcon
                            icon={store.icon}
                            className="h-7 w-7 text-muted-foreground transition-colors group-hover:text-[var(--brand-hex)]"
                          />
                        ) : (
                          <span className="text-[0.8125rem] font-medium transition-colors group-hover:text-brand-tint">
                            {store.label}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Explore: wiki, official site, socials, video — reference material
          rather than a purchase action, so it stays quiet relative to Get
          the Game. */}
      {reference.length > 0 && (
        <section id="explore" className="shell scroll-mt-20 py-16 md:py-20">
          <Reveal className="text-center">
            <h2 className="text-2xl font-light tracking-tight">Explore</h2>
            <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-2.5 text-[0.8125rem]">
              {reference.map((link, i) => (
                <li key={link.key} className="flex items-center gap-2">
                  {i > 0 && (
                    <span aria-hidden className="text-hairline">
                      &middot;
                    </span>
                  )}
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-copy transition-colors hover:text-brand-tint"
                    style={
                      link.icon
                        ? ({ "--brand-hex": `#${link.icon.hex}` } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {link.icon ? (
                      <BrandIcon
                        icon={link.icon}
                        className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-[var(--brand-hex)]"
                      />
                    ) : (
                      <Globe
                        className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-brand-tint"
                        strokeWidth={1.5}
                      />
                    )}
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      {/* Reviews & Ratings */}
      <section id="community" className="shell scroll-mt-20 py-16 md:py-20">
        <Reveal>
          <h2 className="text-center text-2xl font-light tracking-tight">
            Reviews &amp; Ratings
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-6">
            {isAuthed && !emailVerified && (
              <p className="rounded-md border border-hairline bg-elevated p-4 text-sm text-copy">
                Verify your email to comment or rate. Check your inbox for a
                confirmation link.
              </p>
            )}

            {isAuthed && (
              <div className="space-y-5 rounded-md border border-hairline bg-elevated p-5">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Your rating
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <Slider
                      aria-label="Your rating, 0 to 10"
                      min={0}
                      max={10}
                      step={0.5}
                      value={[rating]}
                      onValueChange={([v]) => setRating(v)}
                      disabled={!emailVerified}
                      className="flex-1"
                    />
                    <span className="w-10 shrink-0 text-right text-lg tabular-nums text-foreground">
                      {rating}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={handleRate}
                    disabled={!emailVerified || ratePending}
                    aria-busy={ratePending}
                  >
                    {ratePending ? "Saving…" : "Submit rating"}
                  </Button>
                </div>

                <form
                  onSubmit={handleComment}
                  className="space-y-3 border-t border-hairline pt-5"
                >
                  <Input
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={!emailVerified}
                    aria-label="Add a comment"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!emailVerified || commentPending}
                    aria-busy={commentPending}
                  >
                    {commentPending ? "Posting…" : "Post comment"}
                  </Button>
                </form>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {data.comments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No reviews yet. Be the first.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {data.comments.map((c) => (
                  <li key={c.id} className="flex gap-3 py-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-xs font-medium text-white">
                      {c.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        c.username.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {c.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-[0.8125rem] leading-relaxed text-copy">
                        {c.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Score summary panel */}
          <aside className="h-fit space-y-4 rounded-md bg-elevated p-6">
            <RatingRow
              icon={
                <Star
                  className={data.userRating != null ? "fill-current" : undefined}
                  strokeWidth={1.5}
                />
              }
              value={data.userRating != null ? data.userRating.toFixed(1) : "N/A"}
              label="Personal rating"
            />
            <RatingRow
              icon={<Star className="fill-current" strokeWidth={1.5} />}
              value={
                data.ludiAvgRating != null ? data.ludiAvgRating.toFixed(1) : "N/A"
              }
              label="Ludi user rating"
            />
            <RatingRow
              icon={<Star className="fill-current" strokeWidth={1.5} />}
              value={game.rating != null ? (game.rating / 10).toFixed(1) : "N/A"}
              label="IGDB user rating"
            />
            <RatingRow
              icon={
                <span className="flex h-7 min-w-9 items-center justify-center rounded-sm bg-white px-1.5 text-sm font-bold text-void">
                  {game.aggregated_rating != null
                    ? Math.round(game.aggregated_rating)
                    : "—"}
                </span>
              }
              label="Critic rating"
            />
          </aside>
        </div>
      </section>

      {/* Related */}
      <section id="related" className="shell scroll-mt-20 space-y-12 pb-20">
        {RELATED_SECTIONS.map(({ key, label }) => {
          const cards = data.related[key] ?? [];
          return cards.length > 0 ? (
            <Reveal key={key}>
              <h2 className="mb-5 text-xl font-light tracking-tight">{label}</h2>
              <GameRow games={cards} />
            </Reveal>
          ) : null;
        })}

        {/* Always shown: IGDB catalogues only a slice of any game's mods, so the
            Nexus tile is worth offering even when that slice is empty. */}
        <Reveal>
          <h2 className="mb-5 text-xl font-light tracking-tight">Mods</h2>
          <GameRow
            games={data.related.mods ?? []}
            leading={
              <ExternalLinkCard
                href={`https://www.nexusmods.com/search/?BH%5Bsearch%5D=${encodeURIComponent(
                  game.name,
                )}`}
                title="Nexus Mods"
                subtitle="Search mods"
              />
            }
          />
        </Reveal>

        {(data.related.similar ?? []).length > 0 && (
          <Reveal>
            <h2 className="mb-5 text-xl font-light tracking-tight">
              Similar games
            </h2>
            <GameRow games={data.related.similar} />
          </Reveal>
        )}
      </section>
    </article>
  );
}

function ScoreStat({
  label,
  value,
  icon,
  boxed,
}: {
  label: string;
  value: string;
  icon?: boolean;
  boxed?: boolean;
}) {
  return (
    <div className="text-center">
      {boxed ? (
        <span className="flex h-10 min-w-12 items-center justify-center rounded-sm border-2 border-white px-2 text-xl font-bold text-white">
          {value}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-1.5 text-2xl font-light text-white">
          {icon && <Star className="h-5 w-5 fill-current" strokeWidth={1.5} />}
          {value}
        </span>
      )}
      <span className="mt-1 block text-xs text-white/60">{label}</span>
    </div>
  );
}

function RatingRow({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-9 shrink-0 items-center justify-center text-white [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      {value && (
        <span className="w-9 shrink-0 text-lg tabular-nums text-foreground">
          {value}
        </span>
      )}
      <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
    </div>
  );
}
