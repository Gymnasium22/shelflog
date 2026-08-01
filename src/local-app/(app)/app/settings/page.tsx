"use client";

import { useRouter } from "next/navigation";

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
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted">Локальный режим — без облака и авторизации.</p>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium">Данные</h2>
        <p className="text-sm text-muted">
          Всё хранится в localStorage браузера. Очистка удалит дом, места, коробки и вещи.
        </p>
        <Button type="button" variant="secondary" onClick={handleClear}>
          Очистить локальные данные
        </Button>
      </section>
    </main>
  );
}
