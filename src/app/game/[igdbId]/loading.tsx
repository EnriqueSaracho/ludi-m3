import { Skeleton } from "@/components/loading/Skeleton";

export default function GameLoading() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-10 w-full max-w-md" />
      <section className="grid gap-8 md:grid-cols-[240px_1fr]">
        <Skeleton className="aspect-[3/4] w-full max-w-[240px] rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-9 w-3/4 max-w-sm" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-48 rounded-md" />
          </div>
        </div>
      </section>
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
