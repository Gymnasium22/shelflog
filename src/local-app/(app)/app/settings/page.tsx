"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Database, Trash2 } from "lucide-react";

import { PageHeader } from "@/local-app/ui/page-header";
import { Surface } from "@/local-app/ui/surface";
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
    <main className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Настройки"
        description="Локальный режим — без облака и авторизации."
      />

      <Surface elevated className="animate-fade-up animate-fade-up-delay-1 space-y-5">
        <div className="flex items-start gap-3.5">
          <span className="icon-chip flex h-11 w-11 shrink-0 items-center justify-center">
            <Database className="h-4 w-4" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold tracking-tight">
              Данные на устройстве
            </h2>
            <p className="text-sm leading-relaxed text-muted">{summary}</p>
            <p className="text-sm leading-relaxed text-muted">
              Всё в localStorage. Очистка необратима на этом устройстве.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="danger"
          onClick={handleClear}
          className="w-full"
        >
          <Trash2 className="h-4 w-4" />
          Очистить локальные данные
        </Button>
      </Surface>

      <Surface className="animate-fade-up animate-fade-up-delay-2 space-y-4">
        <div className="flex items-center gap-2.5">
          <CloudOff className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold tracking-tight">О версии</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">
              Есть сейчас
            </p>
            <ul className="space-y-1.5 text-sm text-muted">
              <li className="flex gap-2">
                <span className="text-accent">✓</span> Дом, места, коробки, вещи
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span> Только браузер
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">
              Позже с облаком
            </p>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>· Аккаунты и семья</li>
              <li>· Документы и QR</li>
              <li>· Поиск по дому</li>
            </ul>
          </div>
        </div>
      </Surface>
    </main>
  );
}
