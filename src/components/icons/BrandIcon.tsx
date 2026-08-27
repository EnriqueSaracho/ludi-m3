import type { BrandIconData } from "@/lib/game/websites";

/** Renders a simple-icons path. Color is driven by the parent via
 *  `currentColor` so callers control the idle/hover state with Tailwind. */
export function BrandIcon({
  icon,
  className,
}: {
  icon: BrandIconData;
  className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d={icon.path} />
    </svg>
  );
}
