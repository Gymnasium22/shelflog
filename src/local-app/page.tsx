import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, HardDrive, House, ShieldCheck } from "lucide-react";

import { RedirectToApp } from "@/local-app/ui/redirect-to-app";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/shared/config/constants";

export const dynamic = "force-static";

export default function LocalHomePage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <RedirectToApp />

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
          Локальный режим · без аккаунта
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Цифровой паспорт{" "}
          <span className="bg-gradient-to-r from-accent to-sky-300 bg-clip-text text-transparent">
            дома
          </span>
        </h1>
        <p className="max-w-xl text-lg text-muted text-pretty">
          Вещи, места и коробки — прямо в браузере. Данные не уходят в облако,
          пока вы сами не подключите синхронизацию.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-[0_0_24px_var(--surface-glow)] transition hover:opacity-90"
        >
          Открыть приложение
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        <Feature
          icon={<HardDrive className="h-4 w-4" />}
          title="Только устройство"
          text="localStorage, без сервера"
        />
        <Feature
          icon={<House className="h-4 w-4" />}
          title="Дом и места"
          text="Иерархия хранения"
        />
        <Feature
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Приватно"
          text="Нет логина и трекинга"
        />
      </ul>

      <p className="text-sm text-muted">
        Валюта по умолчанию: {DEFAULT_CURRENCY} · язык: {DEFAULT_LOCALE}
      </p>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted">{text}</p>
    </li>
  );
}
