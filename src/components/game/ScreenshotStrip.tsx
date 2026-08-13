"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { igdbImageUrl } from "@/lib/igdb/images";
import { cn } from "@/lib/utils";

/** Full-bleed screenshot rail on the game page. Clicking a shot opens it
 *  full-size; arrows page the rail by roughly one viewport. */
export function ScreenshotStrip({
  imageIds,
  gameName,
}: {
  imageIds: string[];
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
  }, [imageIds.length]);

  const move = useCallback(
    (delta: number) => {
      setLightbox((current) => {
        if (current == null) return current;
        return (current + delta + imageIds.length) % imageIds.length;
      });
    },
    [imageIds.length],
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

  if (imageIds.length === 0) return null;

  return (
    <section className="relative bg-void py-10" aria-label="Screenshots">
      <div
        ref={trackRef}
        className="scroll-hidden flex gap-3 overflow-x-auto px-6 scroll-smooth"
      >
        {imageIds.map((id, i) => {
          const url = igdbImageUrl(id, "screenshot_med");
          if (!url) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setLightbox(i)}
              className="group relative aspect-video h-[9.5rem] shrink-0 overflow-hidden rounded-md bg-sunken ring-1 ring-white/10 transition-all duration-300 hover:ring-brand md:h-[13rem]"
              aria-label={`View screenshot ${i + 1} of ${imageIds.length}`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="(max-width: 768px) 40vw, 340px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-void/25 opacity-100 transition-opacity duration-300 group-hover:opacity-0" />
            </button>
          );
        })}
      </div>

      {!atStart && (
        <RailArrow side="left" onClick={() => page(-1)} />
      )}
      {!atEnd && <RailArrow side="right" onClick={() => page(1)} />}

      {lightbox != null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-void/95 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${gameName} screenshot ${lightbox + 1}`}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-5 top-5 rounded-full border border-hairline-strong p-2 text-white transition-colors hover:bg-white hover:text-void"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div
            className="relative aspect-video w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={igdbImageUrl(imageIds[lightbox], "1080p")!}
              alt={`${gameName} screenshot ${lightbox + 1}`}
              fill
              sizes="90vw"
              className="rounded-md object-contain"
            />
          </div>

          {imageIds.length > 1 && (
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
        "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
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
      aria-label={side === "left" ? "Previous screenshot" : "Next screenshot"}
      className={cn(
        "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full",
        "border border-white/20 text-white transition-colors hover:bg-white hover:text-void",
        side === "left" ? "left-5" : "right-5",
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={1.5} />
    </button>
  );
}
