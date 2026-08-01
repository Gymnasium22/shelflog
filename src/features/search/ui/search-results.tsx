import Link from "next/link";

import {
  SEARCH_ENTITY_LABELS,
  hrefForSearchHit,
  type SearchHit,
} from "@/features/search/model/types";

export function SearchResults({
  hits,
  emptyHint,
}: {
  hits: SearchHit[];
  emptyHint: string;
}) {
  if (hits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-muted">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {hits.map((hit) => (
        <li key={`${hit.entity_type}-${hit.entity_id}`}>
          <Link
            href={hrefForSearchHit(hit)}
            className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-border/20"
          >
            <div className="min-w-0">
              <p className="font-medium">{hit.title}</p>
              {hit.subtitle ? (
                <p className="truncate text-xs text-muted">{hit.subtitle}</p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-lg bg-border/40 px-2 py-1 text-xs font-medium text-muted">
              {SEARCH_ENTITY_LABELS[hit.entity_type] ?? hit.entity_type}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
