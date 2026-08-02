import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  HardDrive,
  House,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { RedirectToApp } from "@/local-app/ui/redirect-to-app";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/shared/config/constants";

export const dynamic = "force-static";

export default function LocalHomePage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center gap-12 px-6 py-16 sm:py-20">
      <RedirectToApp />

      {/* Decorative orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 right-0 h-48 w-48 rounded-full bg-accent-secondary/20 blur-[90px]"
      />

      <div className="animate-fade-up relative space-y-6">
        <div className="badge-soft w-fit">
          <Sparkles className="h-3 w-3 text-accent" />
          Локальный режим · без аккаунта
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl sm:leading-[1.05]">
          Цифровой паспорт{" "}
          <span className="text-gradient">дома</span>
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-muted text-pretty sm:text-lg">
          Вещи, места и коробки — красиво и быстро, прямо в браузере. Данные
          остаются на устройстве, пока вы сами не подключите облако.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/app"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-accent to-cyan-400 px-6 text-sm font-semibold text-accent-foreground shadow-[0_12px_40px_-12px_var(--surface-glow)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Открыть приложение
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-muted">
            {DEFAULT_CURRENCY} · {DEFAULT_LOCALE}
          </span>
        </div>
      </div>

      <ul className="relative grid gap-3 sm:grid-cols-3">
        <Feature
          className="animate-fade-up animate-fade-up-delay-1"
          icon={<HardDrive className="h-4 w-4" />}
          title="Только устройство"
          text="localStorage, без сервера и трекинга"
        />
        <Feature
          className="animate-fade-up animate-fade-up-delay-2"
          icon={<Layers3 className="h-4 w-4" />}
          title="Структура дома"
          text="Места → коробки → вещи"
        />
        <Feature
          className="animate-fade-up animate-fade-up-delay-3"
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Приватно"
          text="Без логина и синхронизации"
        />
      </ul>

      <div className="animate-fade-up animate-fade-up-delay-3 surface relative overflow-hidden rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="icon-chip flex h-12 w-12 items-center justify-center">
            <House className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold tracking-tight">
              Готовы навести порядок?
            </p>
            <p className="text-sm text-muted">
              Создайте дом за 10 секунд и начните раскладывать вещи.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-card/50 px-4 text-sm font-medium transition hover:border-accent/40 hover:text-accent"
          >
            Начать
          </Link>
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
  className,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <li
      className={`surface group rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/25 ${className ?? ""}`}
    >
      <div className="icon-chip mb-3 flex h-10 w-10 items-center justify-center transition group-hover:scale-105">
        {icon}
      </div>
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
    </li>
  );
}
