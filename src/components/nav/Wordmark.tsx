import { cn } from "@/lib/utils";

/** The Ludi wordmark: purple gradient lettering with the two sparkle marks
 *  that sit above the "L" and the "d" in the prototype. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block select-none pr-1 text-[1.375rem] font-bold leading-none tracking-tight",
        className,
      )}
    >
      <span className="bg-gradient-to-br from-[#c86bf0] via-brand to-[#5d2a86] bg-clip-text text-transparent">
        Ludi
      </span>
      <span
        aria-hidden
        className="absolute -top-1 right-0 h-1.5 w-1.5 rotate-45 bg-brand-tint"
      />
      <span
        aria-hidden
        className="absolute -top-2 left-0 h-1 w-1 rotate-45 bg-brand-tint/70"
      />
    </span>
  );
}
