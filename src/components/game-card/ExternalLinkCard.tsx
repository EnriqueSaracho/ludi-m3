import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cover-slot tile that leaves the site. Shares SeeAllCard's geometry so a row
 *  of covers can carry an outbound destination — the mods row and Nexus — with
 *  no visual seam. */
export function ExternalLinkCard({
  href,
  title,
  subtitle,
  className,
}: {
  href: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group/out flex w-[150px] shrink-0 flex-col", className)}
    >
      <div
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-lg bg-sunken",
          "ring-1 ring-white/5 transition-all duration-300",
          "group-hover/out:-translate-y-1 group-hover/out:ring-brand",
          "group-hover/out:shadow-[0_18px_40px_-18px_rgb(0_0_0/0.9),0_0_0_1px_var(--accent)]",
          "group-focus-visible/out:ring-brand",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.045] to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/out:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--accent) 32%, transparent), transparent 68%)",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full",
              "border border-hairline-strong bg-void/50 text-copy backdrop-blur-sm",
              "transition-colors duration-300",
              "group-hover/out:border-brand group-hover/out:bg-brand group-hover/out:text-white",
            )}
          >
            <ArrowUpRight className="h-5 w-5" strokeWidth={1.5} />
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex min-w-0 flex-col">
        <h3 className="line-clamp-2 text-[0.8125rem] font-normal leading-snug text-foreground transition-colors group-hover/out:text-brand-tint">
          {title}
        </h3>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </a>
  );
}
