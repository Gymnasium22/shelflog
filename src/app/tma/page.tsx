import Link from "next/link";

import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export default async function TmaHomePage() {
  const household = await getActiveHousehold();
  const supabase = await createClient();

  if (!household) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Нет дома</h1>
        <p className="text-sm text-muted">
          Создайте дом в полной версии приложения (браузер), затем откройте Mini
          App снова.
        </p>
        <Link
          href="/app"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          Открыть веб
        </Link>
      </div>
    );
  }

  const [{ count: items }, { count: boxes }, { data: recent }] =
    await Promise.all([
      supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("household_id", household.id),
      supabase
        .from("boxes")
        .select("*", { count: "exact", head: true })
        .eq("household_id", household.id),
      supabase
        .from("items")
        .select("id, name")
        .eq("household_id", household.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const recentItems =
    (recent as { id: string; name: string }[] | null) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {household.name}
        </h1>
        <p className="text-sm text-muted">
          {items ?? 0} вещей · {boxes ?? 0} коробок
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TmaLink href="/tma/search" title="Поиск" />
        <TmaLink href="/tma/items/new" title="Быстро добавить" />
        <TmaLink href="/tma/scan" title="Сканер QR" />
        <TmaLink href="/app" title="Полная версия" />
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
          Недавние вещи
        </h2>
        {recentItems.length === 0 ? (
          <p className="text-sm text-muted">Пока пусто</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {recentItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/tma/items/${item.id}`}
                  className="block px-3 py-2.5 text-sm font-medium"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TmaLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card px-3 py-4 text-center text-sm font-medium"
    >
      {title}
    </Link>
  );
}
