import * as React from "react";

import { cn } from "@/lib/utils";

/** `pill` is the rounded search field from the prototype's hero and nav; the
 *  default is the squarer form control used everywhere else. */
type Props = React.ComponentProps<"input"> & {
  variant?: "default" | "pill";
};

function Input({ className, type, variant = "default", ...props }: Props) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full border bg-sunken px-3 py-1 text-sm text-foreground transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "pill"
          ? "h-11 rounded-full border-hairline-strong bg-void px-5"
          : "rounded-md border-input",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
