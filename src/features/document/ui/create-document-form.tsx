"use client";

import { useActionState, useMemo, useState } from "react";

import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
} from "@/entities/document/model/types";
import type { Box } from "@/entities/box/model/types";
import type { Item } from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import {
  createDocumentAction,
  type ActionState,
} from "@/features/document/api/actions";
import { formatFileSize } from "@/shared/lib/files";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const emptyState: ActionState = { ok: true, message: null };

const accept =
  ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";

export function CreateDocumentForm({
  locations,
  items,
  boxes,
  defaultItemId,
  defaultBoxId,
}: {
  locations: StorageLocation[];
  items: Item[];
  boxes: Box[];
  defaultItemId?: string | null;
  defaultBoxId?: string | null;
}) {
  const [state, action, pending] = useActionState(
    createDocumentAction,
    emptyState,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const defaultTitle = useMemo(() => {
    if (!fileName) return "";
    return fileName.replace(/\.[^.]+$/, "");
  }, [fileName]);

  return (
    <form action={action} className="space-y-4">
      {state.message && !state.ok ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}

      <div>
        <Label htmlFor="file">Файл *</Label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept={accept}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-foreground"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileName(f?.name ?? null);
            setFileSize(f?.size ?? null);
          }}
        />
        <p className="mt-1.5 text-xs text-muted">
          PDF, JPEG, PNG, WEBP, HEIC · до 20 МБ
          {fileSize != null ? ` · выбран: ${formatFileSize(fileSize)}` : ""}
          {fileSize != null && fileSize > MAX_DOCUMENT_BYTES
            ? " · слишком большой"
            : ""}
        </p>
      </div>

      <div>
        <Label htmlFor="title">Название *</Label>
        <Input
          id="title"
          name="title"
          required
          key={defaultTitle}
          defaultValue={defaultTitle}
          placeholder="Гарантийный талон"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">Тип</Label>
          <select
            id="type"
            name="type"
            defaultValue="receipt"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="issuedAt">Дата документа</Label>
          <Input id="issuedAt" name="issuedAt" type="date" />
        </div>
      </div>

      <div>
        <Label htmlFor="originalLocationId">
          Где лежит бумажный оригинал *
        </Label>
        <select
          id="originalLocationId"
          name="originalLocationId"
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          defaultValue=""
        >
          <option value="">Не указано (лучше указать)</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {"—".repeat(loc.depth)} {loc.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">
          Например: Шкаф → Верхняя полка → Белая папка
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="itemId">Привязка к вещи</Label>
          <select
            id="itemId"
            name="itemId"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue={defaultItemId ?? ""}
          >
            <option value="">Без привязки</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="boxId">Привязка к коробке</Label>
          <select
            id="boxId"
            name="boxId"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue={defaultBoxId ?? ""}
          >
            <option value="">Без привязки</option>
            {boxes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code}
                {b.name ? ` — ${b.name}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Заметки</Label>
        <Input id="notes" name="notes" placeholder="Необязательно" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Загружаем…" : "Сохранить документ"}
      </Button>
    </form>
  );
}
