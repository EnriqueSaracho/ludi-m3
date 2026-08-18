import { GameCardGridSkeleton } from "@/components/loading/GameCardGridSkeleton";
import { Skeleton } from "@/components/loading/Skeleton";

export default function ListLoading() {
  return (
    <div className="shell space-y-6 py-10">
      <Skeleton className="h-8 w-48" />
      <GameCardGridSkeleton count={10} />
    </div>
  );
}
