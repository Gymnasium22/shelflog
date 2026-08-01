import Link from "next/link";

import { checkSupabaseConnection } from "@/shared/api/supabase/health";
import { getPublicEnvStatus } from "@/shared/config/env";

export const metadata = {
  title: "Проверка",
};

export default async function HealthPage() {
  const env = getPublicEnvStatus();
  const result = await checkSupabaseConnection();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <Link
          href="/"
          className="text-sm text-muted transition hover:text-foreground"
        >
          ← Назад
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Проверка Supabase
        </h1>
        <p className="text-sm text-muted">
          Этап 3: клиент и переменные окружения без авторизации и схемы домена.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <Row
          label="URL"
          value={env.hasSupabaseUrl ? "задан" : "не задан"}
          ok={env.hasSupabaseUrl}
        />
        <Row
          label="Anon key"
          value={env.hasSupabaseAnonKey ? "задан" : "не задан"}
          ok={env.hasSupabaseAnonKey}
        />
        <Row
          label="Соединение"
          value={result.message}
          ok={result.ok}
        />
        {result.latencyMs != null ? (
          <Row
            label="Задержка"
            value={`${result.latencyMs} ms`}
            ok={result.ok}
          />
        ) : null}
      </div>

      {!env.ready ? (
        <p className="text-sm text-muted">
          Создайте файл <code className="rounded bg-border/60 px-1.5 py-0.5">.env.local</code>{" "}
          по образцу <code className="rounded bg-border/60 px-1.5 py-0.5">.env.example</code>.
        </p>
      ) : null}
    </main>
  );
}

function Row({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-right font-medium ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
        {value}
      </span>
    </div>
  );
}
