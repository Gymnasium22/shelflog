"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  LOCATION_TYPES,
  type LocationType,
} from "@/entities/location/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export type ActionState = {
  ok: boolean;
  message: string | null;
};

const createSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  type: z.enum(LOCATION_TYPES),
  parentId: z.string().uuid().nullable(),
  description: z.string().trim().max(500).optional(),
});

export async function createLocationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parentRaw = String(formData.get("parentId") ?? "");
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || "other",
    parentId: parentRaw === "" || parentRaw === "root" ? null : parentRaw,
    description: String(formData.get("description") ?? "") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Проверьте поля",
    };
  }

  const household = await getActiveHousehold();
  if (!household) {
    return { ok: false, message: "Сначала создайте дом" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("storage_locations").insert({
    household_id: household.id,
    name: parsed.data.name,
    type: parsed.data.type as LocationType,
    parent_id: parsed.data.parentId,
    description: parsed.data.description ?? null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/app/locations");
  revalidatePath("/app");
  return { ok: true, message: "Место добавлено" };
}

export async function deleteLocationAction(id: string): Promise<ActionState> {
  const household = await getActiveHousehold();
  if (!household) {
    return { ok: false, message: "Нет дома" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("storage_locations")
    .delete()
    .eq("id", id)
    .eq("household_id", household.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/app/locations");
  revalidatePath("/app");
  return { ok: true, message: "Удалено" };
}
