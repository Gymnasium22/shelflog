"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export type ActionState = {
  ok: boolean;
  message: string | null;
};

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

  const household = await getActiveHousehold();
  if (!household) {
    return { ok: false, message: "Сначала создайте дом" };
  }

  const supabase = await createClient();
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
  revalidatePath("/app/boxes");
  revalidatePath("/app");
  redirect(`/app/boxes/${box.id}`);
}

export async function deleteBoxAction(id: string): Promise<ActionState> {
  const household = await getActiveHousehold();
  if (!household) return { ok: false, message: "Нет дома" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("boxes")
    .delete()
    .eq("id", id)
    .eq("household_id", household.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/app/boxes");
  revalidatePath("/app");
  return { ok: true, message: "Удалено" };
}
