import Link from "next/link";
import { redirect } from "next/navigation";

import { PushOptIn } from "@/features/pwa/ui/push-opt-in";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  return (
    <main className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted">
          PWA, уведомления · дом «{household.name}»
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 text-sm">
        <h2 className="text-sm font-semibold">Установка приложения</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
          <li>
            <strong className="text-foreground">Android / Chrome:</strong>{" "}
            меню браузера → «Установить приложение» или баннер внизу.
          </li>
          <li>
            <strong className="text-foreground">iPhone / Safari:</strong>{" "}
            Поделиться → «На экран «Домой»».
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          Splash / иконка берутся из web manifest. Service Worker кэширует
          оболочку (production-сборка).
        </p>
      </section>

      <PushOptIn />

      <Link
        href="/app"
        className="inline-flex text-sm text-muted underline-offset-4 hover:underline"
      >
        ← Dashboard
      </Link>
    </main>
  );
}
