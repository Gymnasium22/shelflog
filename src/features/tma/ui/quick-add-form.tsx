"use client";

import { useActionState } from "react";

import {
  tmaQuickCreateItem,
  type TmaActionState,
} from "@/features/tma/api/actions";
import type { Box } from "@/entities/box/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const empty: TmaActionState = { ok: true, message: null };

export function QuickAddForm({
  locations,
  boxes,
}: {
  locations: StorageLocation[];
  boxes: Box[];
}) {
  const [state, action, pending] = useActionState(tmaQuickCreateItem, empty);

  return (
    <form action={action} className="space-y-3">
      {state.message && !state.ok ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <div>
        <Label htmlFor="name">Название *</Label>
        <Input id="name" name="name" required placeholder="Зарядка GoPro" autoFocus />
      </div>
      <div>
        <Label htmlFor="brand">Бренд</Label>
        <Input id="brand" name="brand" />
      </div>
      <div>
        <Label htmlFor="locationId">Место</Label>
        <select
          id="locationId"
          name="locationId"
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          defaultValue=""
        >
          <option value="">Не указано</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {"—".repeat(l.depth)} {l.name}
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
      <div>
        <Label htmlFor="notes">Заметки</Label>
        <Input id="notes" name="notes" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Сохраняем…" : "Добавить"}
      </Button>
    </form>
  );
}
