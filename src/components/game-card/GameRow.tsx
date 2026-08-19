"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GameCard } from "@/components/game-card/GameCard";
import { SeeAllCard } from "@/components/game-card/SeeAllCard";
import type { GameCardPayload } from "@/lib/game/types";
import { cn } from "@/lib/utils";

type SeeAll = {
  href: string;
  /** Games on the whole list — `games` is only the previewed slice. */
  total: number;
  listName?: string;
};

/** Horizontally scrolling shelf of covers with arrows that appear only when
 *  there is actually somewhere to scroll. */
export function GameRow({
  games,
  seeAll,
  className,
}: {
  games: GameCardPayload[];
  /** Appends a tail card linking to the full list. */
  seeAll?: SeeAll;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setAtStart(el.scrollLeft <= 2);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [games.length, seeAll?.href]);

  function scrollBy(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className={cn("group/row relative", className)}>
      <div
        ref={trackRef}
        className="scroll-hidden flex gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {games.map((g) => (
          <GameCard key={g.igdbId} game={g} size="sm" showSave={false} />
        ))}
        {seeAll && games.length > 0 && (
          <SeeAllCard
            href={seeAll.href}
            total={seeAll.total}
            shown={games.length}
            listName={seeAll.listName}
          />
        )}
      </div>

      {!atStart && (
        <ArrowButton side="left" onClick={() => scrollBy(-1)} />
      )}
      {!atEnd && <ArrowButton side="right" onClick={() => scrollBy(1)} />}
    </div>
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full",
        "border border-hairline-strong bg-void/85 text-white backdrop-blur",
        "opacity-0 transition-all duration-200 hover:bg-brand hover:border-brand",
        "group-hover/row:opacity-100 focus-visible:opacity-100",
        side === "left" ? "-left-3" : "-right-3",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
