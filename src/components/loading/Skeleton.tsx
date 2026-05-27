import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function Skeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted animate-pulse motion-reduce:animate-none",
        className,
      )}
      aria-hidden
    />
  );
}
