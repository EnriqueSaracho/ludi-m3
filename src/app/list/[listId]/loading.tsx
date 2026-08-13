import { GameCardSkeleton } from "@/components/loading/GameCardSkeleton";
import { Skeleton } from "@/components/loading/Skeleton";

export default function ListLoading() {
  return (
    <div className="shell space-y-6 py-10">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-md border border-hairline bg-elevated p-3"
          >
            <Skeleton className="h-6 w-4 shrink-0" />
            <GameCardSkeleton size="sm" className="flex-1 max-w-none" />
            <Skeleton className="h-8 w-16 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
