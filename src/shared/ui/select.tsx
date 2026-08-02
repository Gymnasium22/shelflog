import type { SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative mt-1.5">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-2xl border border-border bg-background/50 px-4 pr-10 text-sm outline-none transition duration-200",
          "hover:border-[color:var(--border-strong)]",
          "focus-visible:border-accent/50 focus-visible:bg-card/60 focus-visible:ring-2 focus-visible:ring-ring/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
