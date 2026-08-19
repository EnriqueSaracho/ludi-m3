import Link from "next/link";
import { cn } from "@/lib/utils";

const DOT =
  "h-1 w-1 rounded-full bg-copy transition-all duration-300 group-hover/all:bg-white";

/** Tail card for a preview row. Sits in the same cover slot as the games so a
 *  shelf never looks like it ends at its last card, and carries the count the
 *  old header link could not. */
export function SeeAllCard({
  href,
  total,
  shown,
  listName,
  className,
}: {
  href: string;
  /** Games on the whole list, not just the ones the row shows. */
  total: number;
  shown: number;
  listName?: string;
  className?: string;
}) {
  const remaining = Math.max(total - shown, 0);

  return (
    <Link
      href={href}
      aria-label={
        listName
          ? `See all ${total} games in ${listName}`
          : `See all ${total} games`
      }
      className={cn("group/all flex w-[150px] shrink-0 flex-col", className)}
    >
      <div
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-lg bg-sunken",
          "ring-1 ring-white/5 transition-all duration-300",
          "group-hover/all:-translate-y-1 group-hover/all:ring-brand",
          "group-hover/all:shadow-[0_18px_40px_-18px_rgb(0_0_0/0.9),0_0_0_1px_var(--accent)]",
          "group-focus-visible/all:ring-brand",
        )}
      >
        {/* Enough of a sheen that the empty slot reads as a tile rather than a
            cover that failed to load. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.045] to-transparent" />
        {/* Brand bloom on hover, so the tile lights up the way the art does. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/all:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--accent) 32%, transparent), transparent 68%)",
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center gap-[3px] rounded-full",
              "border border-hairline-strong bg-void/50 backdrop-blur-sm",
              "transition-colors duration-300",
              "group-hover/all:border-brand group-hover/all:bg-brand",
            )}
          >
            <span className={cn(DOT, "group-hover/all:-translate-x-[3px]")} />
            <span className={DOT} />
            <span className={cn(DOT, "group-hover/all:translate-x-[3px]")} />
          </span>

          {remaining > 0 && (
            <span className="text-[0.8125rem] tabular-nums text-muted-foreground transition-colors duration-300 group-hover/all:text-white">
              +{remaining}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex min-w-0 flex-col">
        <h3 className="text-[0.8125rem] font-normal leading-snug text-foreground transition-colors group-hover/all:text-brand-tint">
          See all
        </h3>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
          {total} {total === 1 ? "game" : "games"}
        </p>
      </div>
    </Link>
  );
}
