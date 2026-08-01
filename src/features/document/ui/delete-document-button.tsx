"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteDocumentAction } from "@/features/document/api/actions";
import { Button } from "@/shared/ui/button";

export function DeleteDocumentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => {
        if (!confirm("Удалить документ и файл?")) return;
        start(async () => {
          const res = await deleteDocumentAction(id);
          if (res.ok) {
            router.push("/app/documents");
            router.refresh();
          } else {
            alert(res.message ?? "Ошибка");
          }
        });
      }}
    >
      {pending ? "Удаляем…" : "Удалить"}
    </Button>
  );
}
