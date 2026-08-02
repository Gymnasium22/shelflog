import type { InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-border bg-background/50 px-4 text-sm outline-none transition duration-200",
        "placeholder:text-muted/80",
        "hover:border-[color:var(--border-strong)]",
        "focus-visible:border-accent/50 focus-visible:bg-card/60 focus-visible:ring-2 focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
