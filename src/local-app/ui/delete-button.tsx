"use client";

import { Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";

type DeleteButtonProps = {
  label?: string;
  confirmMessage: string;
  onDelete: () => void;
  className?: string;
};

export function DeleteButton({
  label = "Удалить",
  confirmMessage,
  onDelete,
  className,
}: DeleteButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition",
        "hover:bg-danger/10 hover:text-danger",
        className,
      )}
      onClick={() => {
        if (confirm(confirmMessage)) onDelete();
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
