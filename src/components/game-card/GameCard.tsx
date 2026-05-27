"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { igdbImageUrl } from "@/lib/igdb/images";
import type { GameCardPayload } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { AddToListMenu } from "@/components/game-card/AddToListMenu";
import { useState } from "react";

type Props = {
  game: GameCardPayload;
  href?: string;
  priority?: boolean;
  size?: "sm" | "md";
  showRating?: boolean;
  showSave?: boolean;
  isSaved?: boolean;
  className?: string;
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
  listMembership,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const coverUrl = igdbImageUrl(
    game.coverImageId,
    size === "sm" ? "cover_small" : "cover_big",
  );
  const link = href ?? `/game/${game.igdbId}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col",
        size === "sm" ? "w-[140px]" : "w-full min-w-[160px] max-w-[200px]",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        <Link href={link} className="block h-full w-full">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes={size === "sm" ? "140px" : "200px"}
              className="object-cover transition-transform group-hover:scale-[1.02]"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No cover
            </div>
          )}
        </Link>

        {showSave && (
          <button
            type="button"
            className="absolute left-2 top-2 z-10 rounded-md bg-background/80 p-1.5 backdrop-blur"
            aria-label={isSaved ? "Saved" : "Save to list"}
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
            <Bookmark
              className={cn("h-4 w-4", isSaved && "fill-current text-primary")}
            />
          </button>
        )}

        {showRating && game.compositeRating != null && (
          <span className="absolute right-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-semibold tabular-nums">
            {game.compositeRating.toFixed(1)}
          </span>
        )}
      </div>

      <Link href={link} className="mt-2 block">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {game.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[game.contentType, game.releaseDate].filter(Boolean).join(" · ")}
        </p>
      </Link>

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
