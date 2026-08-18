"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Star } from "lucide-react";
import { igdbImageUrl } from "@/lib/igdb/images";
import type { GameCardPayload } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { AddToListMenu } from "@/components/game-card/AddToListMenu";
import { useState, type ReactNode } from "react";

type Props = {
  game: GameCardPayload;
  href?: string;
  priority?: boolean;
  size?: "sm" | "md";
  showRating?: boolean;
  showSave?: boolean;
  isSaved?: boolean;
  className?: string;
  /** Controls layered over the cover art — see the list page drag/remove chips. */
  overlay?: ReactNode;
  listMembership?: Array<{
    id: string;
    name: string;
    system_key: string | null;
    is_system: boolean;
    checked: boolean;
  }>;
};

export function GameCard({
  game,
  href,
  priority,
  size = "md",
  showRating = true,
  showSave = true,
  isSaved = false,
  className,
  overlay,
  listMembership,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const coverUrl = igdbImageUrl(game.coverImageId, "cover_big");
  const link = href ?? `/game/${game.igdbId}`;
  const year = game.releaseYear ?? "TBD";

  return (
    <article
      className={cn(
        "group relative flex flex-col",
        size === "sm" ? "w-[150px] shrink-0" : "w-full",
        className,
      )}
    >
      <Link
        href={link}
        className="block overflow-hidden rounded-lg outline-none"
        tabIndex={-1}
        aria-hidden
      >
        <div
          className={cn(
            "relative aspect-[3/4] overflow-hidden rounded-lg bg-sunken",
            "ring-1 ring-white/5 transition-all duration-300",
            "group-hover:-translate-y-1 group-hover:ring-brand",
            "group-hover:shadow-[0_18px_40px_-18px_rgb(0_0_0/0.9),0_0_0_1px_var(--accent)]",
          )}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes={size === "sm" ? "150px" : "(max-width: 640px) 45vw, 200px"}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
              No cover
            </div>
          )}
          {/* Warms the art up on hover without washing out the cover. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </Link>

      {/* Sits over the cover box but outside the link, so overlaid controls stay
          clickable, and rides the same hover lift as the art beneath them. */}
      {overlay && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] transition-transform duration-300 group-hover:-translate-y-1">
          {overlay}
        </div>
      )}

      <div className="mt-2.5 flex min-w-0 flex-col">
        <Link href={link} className="min-w-0 rounded-sm">
          <h3
            className={cn(
              "line-clamp-2 font-normal leading-snug text-foreground transition-colors group-hover:text-brand-tint",
              size === "sm" ? "text-[0.8125rem]" : "text-[0.9375rem]",
            )}
          >
            {game.name}
          </h3>
          <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{year}</p>
        </Link>

        {size === "md" && (
          <div className="mt-2.5 flex items-center gap-3">
            {game.contentType && (
              <span className="truncate rounded-sm border border-hairline-strong px-1.5 py-0.5 text-[0.6875rem] leading-tight text-copy">
                {game.contentType}
              </span>
            )}

            {showRating && (
              <span className="ml-auto flex shrink-0 items-center gap-1 text-[0.8125rem] tabular-nums text-copy">
                <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                {game.compositeRating != null
                  ? game.compositeRating.toFixed(1)
                  : "N/A"}
              </span>
            )}

            {showSave && (
              <button
                type="button"
                className={cn(
                  "shrink-0 rounded-sm p-0.5 transition-colors",
                  isSaved
                    ? "text-brand-tint"
                    : "text-muted-foreground hover:text-white",
                )}
                aria-label={isSaved ? "Saved to a list" : "Save to list"}
                aria-pressed={isSaved}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!listMembership) {
                    router.push(`/login?next=${encodeURIComponent(pathname)}`);
                    return;
                  }
                  setMenuOpen(true);
                }}
              >
                <Heart
                  className={cn("h-4 w-4", isSaved && "fill-current")}
                  strokeWidth={1.5}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {listMembership && (
        <AddToListMenu
          igdbId={game.igdbId}
          lists={listMembership}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        />
      )}
    </article>
  );
}
