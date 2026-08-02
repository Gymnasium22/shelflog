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
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition duration-200",
        "hover:bg-danger/12 hover:text-danger active:scale-95",
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
