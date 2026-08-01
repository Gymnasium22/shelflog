import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-border bg-card hover:bg-background disabled:opacity-50",
  ghost: "hover:bg-border/40 disabled:opacity-50",
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
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
