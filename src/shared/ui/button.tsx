import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent to-cyan-400 text-accent-foreground shadow-[0_8px_28px_-10px_var(--surface-glow)] hover:brightness-110 active:scale-[0.98]",
  secondary:
    "border border-border bg-card/80 text-foreground shadow-sm hover:border-[color:var(--border-strong)] hover:bg-card-elevated active:scale-[0.98]",
  ghost: "text-muted hover:bg-card/70 hover:text-foreground",
  danger:
    "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15 active:scale-[0.98]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
