"use client";

import { z } from "zod";

import { createClient } from "@/shared/api/supabase/client";
import { getActiveHouseholdClient } from "@/shared/lib/household-client";
import type { ActionState } from "@/shared/types/action-state";

export type { ActionState };

const boxSchema = z.object({
  code: z.string().trim().min(1, "Укажите номер/код").max(40),
  name: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  locationId: z.string().uuid().nullable(),
  notes: z.string().trim().max(1000).optional(),
});

export async function createBoxAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const loc = String(formData.get("locationId") ?? "");
  const parsed = boxSchema.safeParse({
    code: formData.get("code"),
    name: String(formData.get("name") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    locationId: loc === "" ? null : loc,
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Проверьте поля",
    };
  }

  const household = await getActiveHouseholdClient();
  if (!household) {
    return { ok: false, message: "Сначала создайте дом" };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("boxes")
    .insert({
      household_id: household.id,
      code: parsed.data.code,
      name: parsed.data.name ?? null,
      description: parsed.data.description ?? null,
      location_id: parsed.data.locationId,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Коробка с таким кодом уже есть" };
    }
    return { ok: false, message: error.message };
  }

  const box = data as { id: string };
  return { ok: true, message: null, redirectTo: `/app/boxes/${box.id}` };
}

export async function deleteBoxAction(id: string): Promise<ActionState> {
  const household = await getActiveHouseholdClient();
  if (!household) return { ok: false, message: "Нет дома" };

  const supabase = createClient();
  const { error } = await supabase
    .from("boxes")
    .delete()
    .eq("id", id)
    .eq("household_id", household.id);

  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Удалено" };
}
