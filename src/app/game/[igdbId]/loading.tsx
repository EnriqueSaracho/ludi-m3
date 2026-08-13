import { Skeleton } from "@/components/loading/Skeleton";

export default function GameLoading() {
  return (
    <div>
      <Skeleton className="h-[48vh] min-h-[20rem] w-full rounded-none" />

      <div className="flex gap-3 overflow-hidden bg-void px-6 py-10">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton
            key={i}
            className="aspect-video h-[9.5rem] shrink-0 md:h-[13rem]"
          />
        ))}
      </div>

      <div className="shell grid gap-10 py-16 md:grid-cols-[13.5rem_1fr] md:gap-16">
        <div className="mx-auto w-full max-w-[13.5rem] space-y-4 md:mx-0">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="mx-auto h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
