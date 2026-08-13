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
        size === "sm" ? "w-[150px] shrink-0" : "w-full",
        className,
      )}
      aria-hidden
    >
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="mt-2.5 h-4 w-full" />
      <Skeleton className="mt-1.5 h-3 w-1/3" />
      {size === "md" && <Skeleton className="mt-3 h-4 w-2/3" />}
    </article>
  );
}
