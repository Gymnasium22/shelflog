import Link from "next/link";
import { redirect } from "next/navigation";

import { RedirectIfAuthed } from "@/features/auth/ui/redirect-if-authed";
import { getPublicEnvStatus } from "@/shared/config/env";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/shared/config/constants";

export const dynamic = "force-dynamic";

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

export default async function HomePage() {
  if (!isGitHubPages) {
    const env = getPublicEnvStatus();

    if (env.ready) {
      try {
        const { createClient } = await import("@/shared/api/supabase/server");
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          redirect("/app");
        }
      } catch {
        // env incomplete or network — show landing
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      {isGitHubPages ? <RedirectIfAuthed /> : null}
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          ShelfLog
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Цифровой паспорт дома
        </h1>
        <p className="max-w-xl text-lg text-muted text-pretty">
          Операционная система квартиры: вещи, коробки, места хранения,
          документы и оригиналы, гарантии и напоминания.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
        >
          Начать
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium transition hover:bg-background"
        >
          Войти
        </Link>
        {!isGitHubPages ? (
          <Link
            href="/health"
            className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium text-muted transition hover:text-foreground"
          >
            Проверка
          </Link>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        Валюта по умолчанию: {DEFAULT_CURRENCY} · язык: {DEFAULT_LOCALE}
      </p>
    </main>
  );
}
