import { redirect } from "next/navigation";

import { searchHousehold } from "@/features/search/api/search";
import {
  SEARCH_ENTITY_TYPES,
  type SearchEntityType,
} from "@/features/search/model/types";
import { SearchForm } from "@/features/search/ui/search-form";
import { SearchResults } from "@/features/search/ui/search-results";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Поиск" };

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string | string[];
    itemStatus?: string;
    documentType?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const itemStatus = sp.itemStatus ?? "";
  const documentType = sp.documentType ?? "";

  const rawTypes = Array.isArray(sp.type)
    ? sp.type
    : sp.type
      ? [sp.type]
      : [];

  const types = rawTypes.filter((t): t is SearchEntityType =>
    (SEARCH_ENTITY_TYPES as readonly string[]).includes(t),
  );

  // If all 4 checked via form, treat as no type filter (broader SQL path)
  const effectiveTypes =
    types.length === 0 || types.length === SEARCH_ENTITY_TYPES.length
      ? undefined
      : types;

  const hasQuery = q.length > 0 || Boolean(itemStatus || documentType);

  const { hits, error } = hasQuery
    ? await searchHousehold({
        q,
        types: effectiveTypes,
        itemStatus: itemStatus || undefined,
        documentType: documentType || undefined,
      })
    : { hits: [], error: null };

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Поиск</h1>
        <p className="text-sm text-muted">
          Одновременно по вещам, коробкам, документам и местам хранения.
        </p>
      </div>

      <SearchForm
        q={q}
        types={types}
        itemStatus={itemStatus}
        documentType={documentType}
      />

      {error ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {hasQuery ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            Результаты ({hits.length})
          </h2>
          <SearchResults
            hits={hits}
            emptyHint="Ничего не нашлось. Попробуйте другое слово или снимите фильтры."
          />
        </section>
      ) : (
        <p className="text-sm text-muted">
          Примеры: «гирлянда», «Samsung», серийный номер, «гарантия», «№8»,
          «кладовка».
        </p>
      )}
    </main>
  );
}
