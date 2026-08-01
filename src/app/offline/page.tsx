import Link from "next/link";

export const metadata = {
  title: "Офлайн",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          ShelfLog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Нет сети</h1>
        <p className="text-muted text-pretty">
          Вы офлайн. Уже открытые экраны могут остаться в кэше браузера. Новые
          данные и загрузка файлов появятся после подключения.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/app"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
        >
          На Dashboard
        </Link>
        <a
          href="/app"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium"
        >
          Повторить
        </a>
      </div>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted">
        <li>Чтение: кэш service worker (последние страницы)</li>
        <li>Запись: только онлайн (этап 11, v1)</li>
      </ul>
    </main>
  );
}
