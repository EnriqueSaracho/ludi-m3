import { GameCardSkeleton } from "@/components/loading/GameCardSkeleton";
import { cn } from "@/lib/utils";

type Props = {
  count?: number;
  className?: string;
};

export function GameCardGridSkeleton({ count = 12, className }: Props) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}
