import { GameCardSkeleton } from "@/components/loading/GameCardSkeleton";
import { Skeleton } from "@/components/loading/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <Skeleton className="h-10 min-w-[200px] flex-1 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </div>
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }, (_, j) => (
                <GameCardSkeleton key={j} size="sm" />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
