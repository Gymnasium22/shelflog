"use client";

import { useRouter } from "next/navigation";
import { Database, Trash2 } from "lucide-react";

import { PageHeader } from "@/local-app/ui/page-header";
import { clearLocalData } from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";

export default function LocalSettingsPage() {
  const router = useRouter();

  function handleClear() {
    if (!confirm("Удалить все локальные данные на этом устройстве?")) return;
    clearLocalData();
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <PageHeader
        title="Настройки"
        description="Локальный режим — без облака и авторизации."
      />

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Database className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Данные на устройстве</h2>
            <p className="text-sm text-muted">
              Всё в localStorage браузера. Очистка удалит дом, места, коробки и
              вещи без возможности восстановления.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClear}
          className="w-full border-danger/30 text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
          Очистить локальные данные
        </Button>
      </section>
    </main>
  );
}
