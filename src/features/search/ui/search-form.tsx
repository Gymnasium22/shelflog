import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
} from "@/entities/document/model/types";
import {
  ITEM_STATUS_LABELS,
  ITEM_STATUSES,
} from "@/entities/item/model/types";
import {
  SEARCH_ENTITY_LABELS,
  SEARCH_ENTITY_TYPES,
  type SearchEntityType,
} from "@/features/search/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Props = {
  q: string;
  types: SearchEntityType[];
  itemStatus: string;
  documentType: string;
};

export function SearchForm({ q, types, itemStatus, documentType }: Props) {
  return (
    <form
      action="/app/search"
      method="get"
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      <div>
        <Label htmlFor="q">Запрос</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="GoPro, гарантия, №8, серийник, шкаф…"
          autoFocus
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-muted">
          Ищем по названию, бренду, модели, серийнику, заметкам, документам и
          местам.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Типы</legend>
        <div className="flex flex-wrap gap-3">
          {SEARCH_ENTITY_TYPES.map((type) => (
            <label
              key={type}
              className="inline-flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name="type"
                value={type}
                defaultChecked={types.length === 0 || types.includes(type)}
                className="size-4 rounded border-border"
              />
              {SEARCH_ENTITY_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="itemStatus">Статус вещи</Label>
          <select
            id="itemStatus"
            name="itemStatus"
            defaultValue={itemStatus}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="">Любой</option>
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ITEM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="documentType">Тип документа</Label>
          <select
            id="documentType"
            name="documentType"
            defaultValue={documentType}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="">Любой</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">Искать</Button>
        <a
          href="/app/search"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium"
        >
          Сбросить
        </a>
      </div>
    </form>
  );
}
