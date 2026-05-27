import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/loading/Skeleton";

type Props = {
  size?: "sm" | "md";
  className?: string;
};

export function GameCardSkeleton({ size = "md", className }: Props) {
  return (
    <article
      className={cn(
        "flex flex-col",
        size === "sm" ? "w-[140px]" : "w-full min-w-[160px] max-w-[200px]",
        className,
      )}
      aria-hidden
    >
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-3 w-2/3" />
    </article>
  );
}
