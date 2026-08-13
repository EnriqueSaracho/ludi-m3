import { GameCardGridSkeleton } from "@/components/loading/GameCardGridSkeleton";
import { Skeleton } from "@/components/loading/Skeleton";

export default function SearchLoading() {
  return (
    <div className="shell-wide py-10">
      <Skeleton className="h-8 w-64 max-w-full" />
      <div className="mt-8 flex gap-10">
        <aside className="hidden w-[15rem] shrink-0 space-y-2 lg:block" aria-hidden>
          <Skeleton className="mb-4 h-8 w-24" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </aside>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-28" />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="mt-7">
            <GameCardGridSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
