"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/components/loading/Spinner";
import { cn } from "@/lib/utils";

type Props = {
  show: boolean;
  children: ReactNode;
  className?: string;
};

export function LoadingOverlay({ show, children, className }: Props) {
  return (
    <div
      className={cn("relative", className)}
      aria-busy={show}
    >
      {children}
      {show && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]"
          aria-hidden
        >
          <Spinner size="md" />
        </div>
      )}
    </div>
  );
}
