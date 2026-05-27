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
        "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
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
