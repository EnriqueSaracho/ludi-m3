import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md";
  className?: string;
};

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
};

export function Spinner({ size = "md", className }: Props) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin text-muted-foreground motion-reduce:animate-none",
        sizeClass[size],
        className,
      )}
    />
  );
}
