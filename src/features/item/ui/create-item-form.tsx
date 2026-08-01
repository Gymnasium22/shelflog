"use client";

import { useActionState } from "react";

import type { Box } from "@/entities/box/model/types";
import {
  ITEM_STATUS_LABELS,
  ITEM_STATUSES,
} from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import {
  createItemAction,
  type ActionState,
} from "@/features/item/api/actions";

const emptyActionState: ActionState = { ok: true, message: null };
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function CreateItemForm({
  locations,
  boxes,
}: {
  locations: StorageLocation[];
  boxes: Box[];
}) {
  const [state, action, pending] = useActionState(
    createItemAction,
    emptyActionState,
  );

  return (
    <form action={action} className="space-y-4">
      {state.message && !state.ok ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}

      <div>
        <Label htmlFor="name">Название *</Label>
        <Input id="name" name="name" required placeholder="Телевизор" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="brand">Бренд</Label>
          <Input id="brand" name="brand" />
        </div>
        <div>
          <Label htmlFor="model">Модель</Label>
          <Input id="model" name="model" />
        </div>
        <div>
          <Label htmlFor="category">Категория</Label>
          <Input id="category" name="category" placeholder="Техника" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="serialNumber">Серийный номер</Label>
          <Input id="serialNumber" name="serialNumber" />
        </div>
        <div>
          <Label htmlFor="status">Статус</Label>
          <select
            id="status"
            name="status"
            defaultValue="in_use"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          >
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ITEM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="purchasePrice">Цена (BYN)</Label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            min={0}
            step="0.01"
          />
        </div>
        <div>
          <Label htmlFor="purchasedAt">Дата покупки</Label>
          <Input id="purchasedAt" name="purchasedAt" type="date" />
        </div>
        <div>
          <Label htmlFor="storeName">Магазин</Label>
          <Input id="storeName" name="storeName" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="warrantyMonths">Гарантия, мес.</Label>
          <Input id="warrantyMonths" name="warrantyMonths" type="number" min={0} />
        </div>
        <div>
          <Label htmlFor="warrantyUntil">Гарантия до</Label>
          <Input id="warrantyUntil" name="warrantyUntil" type="date" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="locationId">Место хранения</Label>
          <select
            id="locationId"
            name="locationId"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option value="">Не указано</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {"—".repeat(loc.depth)} {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="boxId">Коробка</Label>
          <select
            id="boxId"
            name="boxId"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option value="">Нет</option>
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
        <Label htmlFor="documentsOriginalLocationId">
          Где лежат оригиналы документов
        </Label>
        <select
          id="documentsOriginalLocationId"
          name="documentsOriginalLocationId"
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          defaultValue=""
        >
          <option value="">Не указано</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {"—".repeat(loc.depth)} {loc.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="notes">Заметки</Label>
        <Input id="notes" name="notes" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Создать вещь"}
      </Button>
    </form>
  );
}
