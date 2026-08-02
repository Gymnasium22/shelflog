import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="surface-dashed flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-14 text-center">
      {icon ? (
        <div className="icon-chip mb-1 flex h-12 w-12 items-center justify-center">
          {icon}
        </div>
      ) : null}
      <p className="text-[15px] font-semibold tracking-tight">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
