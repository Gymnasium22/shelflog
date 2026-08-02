import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
  padded?: boolean;
};

export function Surface({
  className,
  elevated = false,
  padded = true,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-3xl",
        elevated ? "surface-elevated" : "surface",
        padded && "p-5 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
