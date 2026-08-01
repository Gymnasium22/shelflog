"use client";

import { useActionState } from "react";

import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPES,
  type StorageLocation,
} from "@/entities/location/model/types";
import {
  createLocationAction,
  type ActionState,
} from "@/features/location/api/actions";

const emptyActionState: ActionState = { ok: true, message: null };
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function CreateLocationForm({
  locations,
  defaultParentId,
}: {
  locations: StorageLocation[];
  defaultParentId?: string | null;
}) {
  const [state, action, pending] = useActionState(
    createLocationAction,
    emptyActionState,
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold tracking-tight">Добавить место</h2>
      {state.message ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            state.ok
              ? "border border-emerald-500/30 bg-emerald-500/10"
              : "border border-amber-500/30 bg-amber-500/10"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <div>
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" required placeholder="Спальня, шкаф…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">Тип</Label>
          <select
            id="type"
            name="type"
            defaultValue="room"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          >
            {LOCATION_TYPES.filter((t) => t !== "home").map((t) => (
              <option key={t} value={t}>
                {LOCATION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="parentId">Внутри</Label>
          <select
            id="parentId"
            name="parentId"
            defaultValue={defaultParentId ?? locations[0]?.id ?? ""}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {"—".repeat(loc.depth)} {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Описание</Label>
        <Input id="description" name="description" placeholder="Необязательно" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Добавить"}
      </Button>
    </form>
  );
}
