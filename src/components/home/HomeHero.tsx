"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { igdbImageUrl } from "@/lib/igdb/images";
import type { FeaturedGame } from "@/lib/home/discovery";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLIDE_MS = 7000;

export function HomeHero({ games }: { games: FeaturedGame[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  const go = useCallback(
    (next: number) => setIndex(((next % games.length) + games.length) % games.length),
    [games.length],
  );

  useEffect(() => {
    if (paused || games.length < 2) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, games.length, go]);

  if (games.length === 0) return null;

  const game = games[index];
  const backdrop = igdbImageUrl(game.backdropImageId, "1080p");

  return (
    <section
      className="grain relative isolate h-[68vh] max-h-[44rem] min-h-[26rem] w-full overflow-hidden bg-void"
      aria-roledescription="carousel"
      aria-label="Featured games"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* `initial={false}` so the first slide paints immediately instead of
          fading up from black on load. */}
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={game.igdbId}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: reduced ? 1 : 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.9, ease: "easeInOut" },
            // Slow drift across the whole slide for a little life.
            scale: { duration: SLIDE_MS / 1000 + 1, ease: "linear" },
          }}
        >
          {backdrop && (
            <Image
              src={backdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Two scrims: one from the bottom to seat the band on the page, one from
          the right so the copy stays readable over busy art. */}
      <div className="scrim-b pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-void/85 via-void/30 to-transparent" />

      <div className="relative z-10 flex h-full items-center">
        <div className="shell-wide flex justify-end">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={game.igdbId}
              className="max-w-lg text-right"
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-balance text-4xl font-light leading-[1.1] tracking-tight text-white md:text-5xl">
                {game.name}
              </h1>
              {game.summary && (
                <p className="ml-auto mt-4 line-clamp-3 max-w-md text-[0.8125rem] leading-relaxed text-white/70">
                  {game.summary}
                </p>
              )}
              <Button asChild className="mt-6" size="lg">
                <Link href={`/game/${game.igdbId}`}>Learn more</Link>
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {games.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-3"
          role="tablist"
          aria-label="Choose featured game"
        >
          {games.map((g, i) => (
            <button
              key={g.igdbId}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={g.name}
              onClick={() => go(i)}
              className="group py-2"
            >
              <span
                className={cn(
                  "block h-0.5 w-12 transition-all duration-300",
                  i === index
                    ? "bg-white"
                    : "bg-white/30 group-hover:bg-white/60",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
