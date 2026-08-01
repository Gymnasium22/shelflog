import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ITEM_STATUS_LABELS,
  ITEM_STATUSES,
  type Item,
  type ItemStatus,
} from "@/entities/item/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Вещи" };

type Props = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function ItemsPage({ searchParams }: Props) {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const sp = await searchParams;
  const statusFilter =
    sp.status &&
    (ITEM_STATUSES as readonly string[]).includes(sp.status)
      ? (sp.status as ItemStatus)
      : null;
  const q = (sp.q ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("items")
    .select("*")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (q) {
    // Escape PostgREST filter metacharacters
    const safe = q.replace(/[%_,]/g, " ");
    query = query.or(
      `name.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%,serial_number.ilike.%${safe}%,notes.ilike.%${safe}%`,
    );
  }

  const { data } = await query;
  const items = (data as Item[] | null) ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Вещи</h1>
          <p className="text-sm text-muted">
            Цифровой паспорт каждой вещи дома.
          </p>
        </div>
        <Link
          href="/app/items/new"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
        >
          Новая вещь
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div className="min-w-[10rem] flex-1">
          <label htmlFor="q" className="mb-1.5 block text-sm font-medium">
            Фильтр по тексту
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Название, бренд…"
            className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm"
          />
        </div>
        <div className="min-w-[10rem]">
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
            Статус
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="">Все</option>
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ITEM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
        >
          Применить
        </button>
        <Link
          href="/app/items"
          className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium"
        >
          Сброс
        </Link>
        <Link
          href={q ? `/app/search?q=${encodeURIComponent(q)}` : "/app/search"}
          className="inline-flex h-11 items-center text-sm text-muted underline-offset-4 hover:underline"
        >
          Расширенный поиск
        </Link>
      </form>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted">
            {q || statusFilter
              ? "Нет вещей по этому фильтру."
              : "Вещей пока нет."}
          </p>
          {!q && !statusFilter ? (
            <Link
              href="/app/items/new"
              className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
            >
              Добавить первую
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/app/items/${item.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-border/20"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    {[item.brand, item.model].filter(Boolean).join(" · ") ||
                      item.category ||
                      "—"}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {ITEM_STATUS_LABELS[item.status as ItemStatus] ?? item.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
