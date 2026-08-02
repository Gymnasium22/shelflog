"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Trash2 } from "lucide-react";

import { PageHeader } from "@/local-app/ui/page-header";
import {
  clearLocalData,
  getCounts,
  getHousehold,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";

export default function LocalSettingsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<string>("Загрузка…");

  useEffect(() => {
    const h = getHousehold();
    if (!h) {
      setSummary("Дом ещё не создан — данных нет.");
      return;
    }
    const c = getCounts(h.id);
    setSummary(
      `«${h.name}»: ${c.locations} мест, ${c.boxes} коробок, ${c.items} вещей.`,
    );
  }, []);

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
            <p className="text-sm text-muted">{summary}</p>
            <p className="text-sm text-muted">
              Всё в localStorage. Очистка необратима на этом устройстве.
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

      <section className="rounded-2xl border border-border bg-card/50 p-5 text-sm text-muted">
        <p className="font-medium text-foreground">Что есть в локальной версии</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Дом, места, коробки, вещи</li>
          <li>Хранение только в браузере</li>
        </ul>
        <p className="mt-3 font-medium text-foreground">Пока без облака</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Аккаунты и семья</li>
          <li>Документы и файлы</li>
          <li>QR-печать и сканер</li>
          <li>Поиск по дому</li>
        </ul>
      </section>
    </main>
  );
}
