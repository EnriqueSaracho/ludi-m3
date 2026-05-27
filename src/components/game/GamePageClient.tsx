"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Spinner } from "@/components/loading/Spinner";
import { igdbImageUrl } from "@/lib/igdb/images";
import { addRecentGame } from "@/lib/game/recent-games";
import { GameCard } from "@/components/game-card/GameCard";
import { AddToListMenu } from "@/components/game-card/AddToListMenu";
import {
  postComment,
  rateGame,
  setPlayStatus,
} from "@/lib/lists/actions";
import type { GamePageData } from "@/lib/game/load-game-page";
import {
  PLAY_STATUS_TO_LIST,
  STATUS_LIST_KEYS,
  type GameCardPayload,
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
import { Bookmark } from "lucide-react";

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
  const game = data.game as {
    name: string;
    summary?: string;
    cover?: { image_id?: string };
    game_type?: { type?: string };
    rating?: number;
    aggregated_rating?: number;
  };

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
  const isSaved = lists.some((l) => l.checked);

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
          const platformArg = platform
            ? { platform_name: platform }
            : undefined;
          await setPlayStatus(igdbId, value as PlayStatus, platformArg);
        }
        setLists((prev) =>
          prev.map((l) => {
            if (
              !l.system_key ||
              !STATUS_LIST_KEYS.includes(
                l.system_key as (typeof STATUS_LIST_KEYS)[number],
              )
            ) {
              return l;
            }
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

  const sections = [
    { id: "buy", label: "Buy" },
    { id: "about", label: "About" },
    { id: "community", label: "Community" },
    { id: "related", label: "Related" },
    { id: "next", label: "Next" },
  ];

  return (
    <div className="space-y-10">
      <nav
        className="sticky top-[4.5rem] z-40 -mx-4 flex gap-2 overflow-x-auto border-b border-border bg-background/90 px-4 py-2 backdrop-blur"
        aria-label="Page sections"
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="whitespace-nowrap rounded-full px-3 py-1 text-sm hover:bg-muted"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <section className="grid gap-8 md:grid-cols-[240px_1fr]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
          {coverUrl && (
            <Image src={coverUrl} alt="" fill className="object-cover" priority />
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{game.name}</h1>
          {game.game_type?.type && (
            <p className="text-sm text-muted-foreground">{game.game_type.type}</p>
          )}
          {data.heroPrice && (
            <p className="text-lg font-semibold">
              From {data.heroPrice.amount.toFixed(2)} {data.heroPrice.currency}
            </p>
          )}
          {data.ludiAvgRating != null && (
            <p className="text-sm">
              Ludi rating: <strong>{data.ludiAvgRating}</strong>/10
            </p>
          )}

          {isAuthed ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMenuOpen(true)}
                aria-label={isSaved ? "Saved" : "Save to list"}
              >
                <Bookmark
                  className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <AddToListMenu
                igdbId={igdbId}
                lists={lists}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                onListsChange={setLists}
                onPlayStatusChange={setStatus}
              />

              <div className="w-full space-y-2">
                <p className="text-sm font-medium">Your status</p>
                <div className="flex items-center gap-2">
                  <Select
                    value={status ?? "none"}
                    onValueChange={handleStatusChange}
                    disabled={statusPending}
                  >
                    <SelectTrigger className="w-48" aria-busy={statusPending}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="want">Want to play</SelectItem>
                    <SelectItem value="playing">Playing</SelectItem>
                    <SelectItem value="played">Played</SelectItem>
                  </SelectContent>
                  </Select>
                  {statusPending && <Spinner size="sm" />}
                </div>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="w-48">
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
            </div>
          ) : (
            <Button asChild>
              <Link href={`/login?next=/game/${igdbId}`}>Sign in to save</Link>
            </Button>
          )}
        </div>
      </section>

      <section id="buy" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-semibold">Where to buy</h2>
        <p className="text-sm text-muted-foreground">Region: {country}</p>
        {data.prices.length === 0 ? (
          <p className="text-muted-foreground">No PC prices for this region.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border">
            {data.prices.map((deal, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-4 py-3"
              >
                <span>{deal.shop.name}</span>
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary"
                >
                  {deal.price.amount.toFixed(2)} {deal.price.currency}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="about" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-semibold">About</h2>
        {game.summary && <p className="text-muted-foreground">{game.summary}</p>}
        <div id="accessibility">
          <h3 className="font-medium">Accessibility</h3>
          <p className="text-sm text-muted-foreground">
            Accessibility data is not available from IGDB in v1.
          </p>
        </div>
      </section>

      <section id="community" className="scroll-mt-24 space-y-6">
        <h2 className="text-xl font-semibold">Community</h2>
        {isAuthed && !emailVerified && (
          <p className="rounded-md bg-muted p-3 text-sm">
            Verify your email to comment or rate. Check your inbox for a
            confirmation link.
          </p>
        )}
        {isAuthed && (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium">Your rating (0–10)</label>
              <Slider
                min={0}
                max={10}
                step={0.5}
                value={[rating]}
                onValueChange={([v]) => setRating(v)}
                disabled={!emailVerified}
                className="mt-2"
              />
              <p className="text-sm tabular-nums">{rating}</p>
              <Button
                size="sm"
                className="mt-2"
                onClick={handleRate}
                disabled={!emailVerified || ratePending}
                aria-busy={ratePending}
              >
                {ratePending ? "Saving…" : "Submit rating"}
              </Button>
            </div>
            <form onSubmit={handleComment} className="space-y-2">
              <Input
                placeholder="Add a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!emailVerified}
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ul className="space-y-3">
          {data.comments.map((c) => (
            <li key={c.id} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{c.username}</p>
              <p className="mt-1 text-sm">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="related" className="scroll-mt-24 space-y-8">
        <h2 className="text-xl font-semibold">Related</h2>
        {Object.entries(data.related).map(([key, cards]) =>
          cards.length > 0 ? (
            <div key={key}>
              <h3 className="mb-3 capitalize text-sm font-medium text-muted-foreground">
                {key}
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {cards.map((g: GameCardPayload) => (
                  <GameCard key={g.igdbId} game={g} size="sm" showSave={false} />
                ))}
              </div>
            </div>
          ) : null,
        )}
        <div>
          <h3 className="mb-2 font-medium">Mods</h3>
          <a
            href="https://www.nexusmods.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary"
          >
            Browse mods on Nexus Mods →
          </a>
        </div>
      </section>

      <section id="next" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-semibold">What&apos;s next</h2>
        {data.related.similar.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.related.similar.map((g) => (
              <GameCard key={g.igdbId} game={g} size="sm" showSave={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
