"use client";

import { useActionState } from "react";

import type { StorageLocation } from "@/entities/location/model/types";
import {
  createBoxAction,
  type ActionState,
} from "@/features/box/api/actions";

const emptyActionState: ActionState = { ok: true, message: null };
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function CreateBoxForm({ locations }: { locations: StorageLocation[] }) {
  const [state, action, pending] = useActionState(
    createBoxAction,
    emptyActionState,
  );

  return (
    <form action={action} className="space-y-4">
      {state.message && !state.ok ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Код / номер</Label>
          <Input id="code" name="code" required placeholder="№8" />
        </div>
        <div>
          <Label htmlFor="name">Название</Label>
          <Input id="name" name="name" placeholder="Новый год" />
        </div>
      </div>
      <div>
        <Label htmlFor="locationId">Где стоит</Label>
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
        <Label htmlFor="description">Описание</Label>
        <Input id="description" name="description" />
      </div>
      <div>
        <Label htmlFor="notes">Заметки</Label>
        <Input id="notes" name="notes" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Создаём…" : "Создать коробку"}
      </Button>
    </form>
  );
}
