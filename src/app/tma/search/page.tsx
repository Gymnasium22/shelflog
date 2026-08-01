import Link from "next/link";

import { searchHousehold } from "@/features/search/api/search";
import {
  SEARCH_ENTITY_LABELS,
  hrefForSearchHit,
  type SearchHit,
} from "@/features/search/model/types";
import { getActiveHousehold } from "@/shared/lib/household";

type Props = { searchParams: Promise<{ q?: string }> };

function tmaHref(hit: SearchHit): string {
  const web = hrefForSearchHit(hit);
  if (web.startsWith("/app/items/")) {
    return web.replace("/app/items/", "/tma/items/");
  }
  if (web.startsWith("/app/boxes/")) {
    return web.replace("/app/boxes/", "/tma/boxes/");
  }
  return web;
}

export default async function TmaSearchPage({ searchParams }: Props) {
  const household = await getActiveHousehold();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  if (!household) {
    return <p className="text-sm text-muted">Сначала создайте дом в веб-версии.</p>;
  }

  const { hits, error } = q
    ? await searchHousehold({ q, limit: 30 })
    : { hits: [] as SearchHit[], error: null };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Поиск</h1>
      <form action="/tma/search" method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="GoPro, №8, гарантия…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-sm"
          autoFocus
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          Найти
        </button>
      </form>

      {error ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
      ) : null}

      {!q ? (
        <p className="text-sm text-muted">Введите запрос — ищем по всему дому.</p>
      ) : hits.length === 0 ? (
        <p className="text-sm text-muted">Ничего не найдено.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {hits.map((hit) => (
            <li key={`${hit.entity_type}-${hit.entity_id}`}>
              <Link
                href={tmaHref(hit)}
                className="flex items-center justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{hit.title}</p>
                  {hit.subtitle ? (
                    <p className="truncate text-xs text-muted">{hit.subtitle}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[10px] text-muted">
                  {SEARCH_ENTITY_LABELS[hit.entity_type]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
