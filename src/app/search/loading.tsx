import { GameCardGridSkeleton } from "@/components/loading/GameCardGridSkeleton";
import { Skeleton } from "@/components/loading/Skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 max-w-full" />
      <div className="flex gap-8">
        <aside className="hidden w-52 shrink-0 space-y-6 lg:block" aria-hidden>
          <div>
            <Skeleton className="h-4 w-20" />
            <ul className="mt-2 space-y-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </ul>
          </div>
          <div>
            <Skeleton className="h-4 w-16" />
            <ul className="mt-2 space-y-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </ul>
          </div>
        </aside>
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-9 w-40" />
          <GameCardGridSkeleton />
        </div>
      </div>
    </div>
  );
}
