import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
};

/** Fades and lifts content in as it scrolls into view.
 *
 *  Driven by a CSS scroll-timeline rather than JS: if the browser doesn't
 *  support `animation-timeline` (or scripting is slow or off), the content is
 *  simply visible instead of stuck at `opacity: 0`. See the `reveal` utility. */
export function Reveal({ children, className, as: Comp = "div" }: Props) {
  return <Comp className={cn("reveal", className)}>{children}</Comp>;
}
