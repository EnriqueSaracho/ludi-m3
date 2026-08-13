"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Bookmark, ExternalLink, Star } from "lucide-react";
import { Spinner } from "@/components/loading/Spinner";
import { igdbImageUrl } from "@/lib/igdb/images";
import { addRecentGame } from "@/lib/game/recent-games";
import { GameRow } from "@/components/game-card/GameRow";
import { ScreenshotStrip } from "@/components/game/ScreenshotStrip";
import { AddToListMenu } from "@/components/game-card/AddToListMenu";
import { Reveal } from "@/components/motion/Reveal";
import { postComment, rateGame, setPlayStatus } from "@/lib/lists/actions";
import type { GamePageData } from "@/lib/game/load-game-page";
import {
  PLAY_STATUS_TO_LIST,
  isPlayStatusListKey,
  type PlayStatus,
} from "@/lib/game/types";
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
  playStatus: PlayStatus | null;
  platforms: string[];
};

/** `capitalize` turns the bucket keys into "Dlcs"; these are the real labels. */
const RELATED_LABELS: Record<string, string> = {
  similar: "Similar games",
  dlcs: "DLC",
  expansions: "Expansions",
  bundles: "Bundles",
  ports: "Ports",
  remakes: "Remakes",
  remasters: "Remasters",
  mods: "Mods",
};

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
  screenshots?: Array<{ image_id?: string }>;
  artworks?: Array<{ image_id?: string }>;
};

export function GamePageClient({
  data,
  igdbId,
  country,
  isAuthed,
  emailVerified,
  listMembership,
  playStatus: initialStatus,
  platforms,
}: Props) {
  const game = data.game as IgdbGame;

  const [menuOpen, setMenuOpen] = useState(false);
  const [lists, setLists] = useState(listMembership);
  const [status, setStatus] = useState<PlayStatus | null>(initialStatus);
  const [platform, setPlatform] = useState<string>("");
  const [rating, setRating] = useState(data.userRating ?? 0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusPending, startStatusTransition] = useTransition();
  const [ratePending, startRateTransition] = useTransition();
  const [commentPending, startCommentTransition] = useTransition();

  const coverUrl = igdbImageUrl(game.cover?.image_id, "cover_big");
  const backdropId =
    game.artworks?.[0]?.image_id ?? game.screenshots?.[0]?.image_id ?? null;
  const backdropUrl = igdbImageUrl(backdropId, "1080p");
  const screenshotIds =
    game.screenshots
      ?.map((s) => s.image_id)
      .filter((id): id is string => !!id) ?? [];
  const isSaved = lists.some((l) => l.checked);
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getUTCFullYear()
    : null;

  useEffect(() => {
    setLists(listMembership);
  }, [listMembership]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    addRecentGame({
      igdbId,
      name: game.name,
      coverImageId: game.cover?.image_id ?? null,
    });
  }, [igdbId, game.name, game.cover?.image_id]);

  function handleStatusChange(value: string) {
    if (!isAuthed || statusPending) return;

    const previous = status;
    const nextStatus = value === "none" ? null : (value as PlayStatus);
    setStatus(nextStatus);
    setError(null);

    startStatusTransition(async () => {
      try {
        if (value === "none") {
          await setPlayStatus(igdbId, null);
        } else {
          const platformArg = platform ? { platform_name: platform } : undefined;
          await setPlayStatus(igdbId, value as PlayStatus, platformArg);
        }
        setLists((prev) =>
          prev.map((l) => {
            if (!isPlayStatusListKey(l.system_key)) return l;
            if (value === "none") return { ...l, checked: false };
            return {
              ...l,
              checked:
                PLAY_STATUS_TO_LIST[value as PlayStatus] === l.system_key,
            };
          }),
        );
      } catch (e) {
        setStatus(previous);
        setError(e instanceof Error ? e.message : "Failed to update status");
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
      {/* Hero: wide art, title over it, score row seated on the black base. */}
      <header className="grain relative isolate bg-void">
        <div className="relative h-[48vh] max-h-[34rem] min-h-[20rem] w-full overflow-hidden">
          {backdropUrl && (
            <Image
              src={backdropUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          )}
          <div className="scrim-b absolute inset-0" />

          <div className="absolute inset-x-0 top-0 p-6 md:p-10">
            <div className="shell-wide px-0">
              <h1 className="max-w-3xl text-balance text-3xl font-light leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.8)] md:text-[2.75rem]">
                {game.name}
              </h1>
              <p className="mt-2 text-sm text-white/70">
                {[game.game_type?.type, releaseYear].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>

        <div className="shell-wide flex flex-wrap items-end justify-between gap-6 pb-8">
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
      </header>

      <ScreenshotStrip imageIds={screenshotIds} gameName={game.name} />

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
                <div className="space-y-2.5">
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setMenuOpen(true)}
                  >
                    <Bookmark
                      className={isSaved ? "fill-current" : undefined}
                      strokeWidth={1.5}
                    />
                    {isSaved ? "Saved" : "Save to list"}
                  </Button>
                  <AddToListMenu
                    igdbId={igdbId}
                    lists={lists}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    onListsChange={setLists}
                    onPlayStatusChange={setStatus}
                  />

                  <div className="flex items-center gap-2">
                    <Select
                      value={status ?? "none"}
                      onValueChange={handleStatusChange}
                      disabled={statusPending}
                    >
                      <SelectTrigger className="w-full" aria-busy={statusPending}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No status</SelectItem>
                        <SelectItem value="want">Want to play</SelectItem>
                        <SelectItem value="playing">Playing</SelectItem>
                        <SelectItem value="played">Played</SelectItem>
                      </SelectContent>
                    </Select>
                    {statusPending && <Spinner size="sm" />}
                  </div>

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
                </div>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/login?next=/game/${igdbId}`}>Sign in to save</Link>
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
            <p className="mt-2 text-center text-[0.8125rem] text-muted-foreground">
              PC prices for {country}
            </p>

            {data.prices.length === 0 ? (
              <p className="mt-10 text-center text-muted-foreground">
                No PC prices available for this region.
              </p>
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
                        {deal.price.amount.toFixed(2)} {deal.price.currency}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>
      </section>

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
        {Object.entries(data.related).map(([key, cards]) =>
          cards.length > 0 ? (
            <Reveal key={key}>
              <h2 className="mb-5 text-xl font-light tracking-tight">
                {RELATED_LABELS[key] ?? key}
              </h2>
              <GameRow games={cards} />
            </Reveal>
          ) : null,
        )}

        <div>
          <h2 className="mb-3 text-xl font-light tracking-tight">Mods</h2>
          <a
            href="https://www.nexusmods.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[0.8125rem] text-brand-tint transition-colors hover:text-white"
          >
            Browse mods on Nexus Mods
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          </a>
        </div>
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
