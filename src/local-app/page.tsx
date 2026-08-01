import Link from "next/link";

import { RedirectToApp } from "@/local-app/ui/redirect-to-app";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/shared/config/constants";

export const dynamic = "force-static";

export default function LocalHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <RedirectToApp />
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          ShelfLog
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Цифровой паспорт дома
        </h1>
        <p className="max-w-xl text-lg text-muted text-pretty">
          Локальная версия: данные в браузере, без регистрации.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
        >
          Открыть приложение
        </Link>
      </div>

      <p className="text-sm text-muted">
        Валюта по умолчанию: {DEFAULT_CURRENCY} · язык: {DEFAULT_LOCALE}
      </p>
    </main>
  );
}
