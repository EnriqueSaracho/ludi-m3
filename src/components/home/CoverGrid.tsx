import Image from "next/image";
import Link from "next/link";
import { igdbImageUrl } from "@/lib/igdb/images";
import type { GameCardPayload } from "@/lib/game/types";

/** Cover-only grid used in the "Explore Games" band, where the art carries the
 *  section and titles would only add noise. */
export function CoverGrid({ games }: { games: GameCardPayload[] }) {
  return (
    <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
      {games.map((game) => (
        <li key={game.igdbId}>
          <Link
            href={`/game/${game.igdbId}`}
            className="group block"
            title={game.name}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-sunken ring-1 ring-white/5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:ring-brand group-hover:shadow-[0_20px_45px_-20px_rgb(0_0_0/0.95),0_0_0_1px_var(--accent)]">
              {igdbImageUrl(game.coverImageId, "cover_big_2x") ? (
                <Image
                  src={igdbImageUrl(game.coverImageId, "cover_big_2x")!}
                  alt={game.name}
                  fill
                  sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, 15vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                  {game.name}
                </span>
              )}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
