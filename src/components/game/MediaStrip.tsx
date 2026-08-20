"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { igdbImageUrl } from "@/lib/igdb/images";
import {
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  type MediaItem,
} from "@/lib/game/media";
import { cn } from "@/lib/utils";

/** Full-bleed media rail on the game page: trailers, screenshots and artwork
 *  in one strip. Clicking a tile opens it full-size — images in a lightbox,
 *  videos as an embedded player; arrows page the rail by roughly one viewport. */
export function MediaStrip({
  items,
  gameName,
}: {
  items: MediaItem[];
  gameName: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

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
  }, [items.length]);

  const move = useCallback(
    (delta: number) => {
      setLightbox((current) => {
        if (current == null) return current;
        return (current + delta + items.length) % items.length;
      });
    },
    [items.length],
  );

  useEffect(() => {
    if (lightbox == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, move]);

  function page(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  const active = lightbox != null ? items[lightbox] : null;

  return (
    <section className="relative bg-void py-10" aria-label="Media">
      <div
        ref={trackRef}
        className="scroll-hidden flex gap-3 overflow-x-auto px-6 scroll-smooth"
      >
        {items.map((item, i) => {
          const src =
            item.kind === "video"
              ? youtubeThumbnailUrl(item.videoId)
              : igdbImageUrl(item.imageId, "screenshot_med");
          if (!src) return null;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setLightbox(i)}
              className="group relative aspect-video h-[9.5rem] shrink-0 cursor-pointer overflow-hidden rounded-md bg-sunken ring-1 ring-white/10 transition-all duration-300 hover:ring-brand md:h-[13rem]"
              aria-label={`${item.kind === "video" ? "Play" : "View"} ${item.label} — media ${i + 1} of ${items.length}`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 768px) 40vw, 340px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-void/25 opacity-100 transition-opacity duration-300 group-hover:opacity-0" />

              {item.kind === "video" ? (
                <>
                  {/* Videos carry their own scrim: the play mark and the title
                      both sit on top of an uncontrolled YouTube frame. */}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-void/10 to-transparent" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-void/50 backdrop-blur transition-colors duration-300 group-hover:border-brand group-hover:bg-brand">
                      <Play className="h-4 w-4 translate-x-[1px] fill-white text-white" />
                    </span>
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate px-3 pb-2 text-left text-[0.6875rem] uppercase tracking-wider text-white/80">
                    {item.label}
                  </span>
                </>
              ) : (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-void/80 to-transparent px-3 pb-2 pt-6 text-left text-[0.6875rem] uppercase tracking-wider text-white/0 transition-colors duration-300 group-hover:text-white/80">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!atStart && <RailArrow side="left" onClick={() => page(-1)} />}
      {!atEnd && <RailArrow side="right" onClick={() => page(1)} />}

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-void/95 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${gameName} — ${active.label}`}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-5 top-5 cursor-pointer rounded-full border border-hairline-strong p-2 text-white transition-colors hover:bg-white hover:text-void"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div
            className="relative aspect-video w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {active.kind === "video" ? (
              <iframe
                // Keyed so stepping between videos remounts the player rather
                // than leaving the previous one loaded.
                key={active.videoId}
                src={youtubeEmbedUrl(active.videoId)}
                title={`${gameName} — ${active.label}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full rounded-md border-0"
              />
            ) : (
              <Image
                src={igdbImageUrl(active.imageId, "1080p")!}
                alt={`${gameName} — ${active.label}`}
                fill
                sizes="90vw"
                className="rounded-md object-contain"
              />
            )}
          </div>

          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs uppercase tracking-[0.2em] text-white/50">
            {active.label}
          </p>

          {items.length > 1 && (
            <>
              <LightboxArrow
                side="left"
                onClick={(e) => {
                  e.stopPropagation();
                  move(-1);
                }}
              />
              <LightboxArrow
                side="right"
                onClick={(e) => {
                  e.stopPropagation();
                  move(1);
                }}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}

function RailArrow({
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
        "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full",
        "border border-white/20 bg-void/70 text-white backdrop-blur transition-colors hover:border-brand hover:bg-brand",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
    </button>
  );
}

function LightboxArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous item" : "Next item"}
      className={cn(
        "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full",
        "border border-white/20 text-white transition-colors hover:bg-white hover:text-void",
        side === "left" ? "left-5" : "right-5",
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={1.5} />
    </button>
  );
}
