"use client";

import { useActionState } from "react";

import {
  createHouseholdAction,
  type ActionState,
} from "@/features/household/api/actions";

const emptyActionState: ActionState = { ok: true, message: null };
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function CreateHouseholdForm() {
  const [state, action, pending] = useActionState(
    createHouseholdAction,
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
        <Label htmlFor="name">Название дома</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Например: Наша квартира"
          autoFocus
        />
      </div>
      <p className="text-sm text-muted">
        Валюта по умолчанию — белорусский рубль (BYN). Создадим корень дерева
        мест хранения.
      </p>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Создаём…" : "Создать дом"}
      </Button>
    </form>
  );
}
