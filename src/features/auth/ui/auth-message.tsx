import { cn } from "@/shared/lib/cn";

export function AuthMessage({
  ok,
  message,
}: {
  ok: boolean;
  message: string | null;
}) {
  if (!message) return null;

  return (
    <p
      role="status"
      className={cn(
        "rounded-xl border px-3.5 py-3 text-sm",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
      )}
    >
      {message}
    </p>
  );
}
