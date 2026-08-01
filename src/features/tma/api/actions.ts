"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export type TmaActionState = {
  ok: boolean;
  message: string | null;
};

const quickItemSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(200),
  brand: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional(),
  locationId: z.string().uuid().nullable(),
  boxId: z.string().uuid().nullable(),
});

export async function tmaQuickCreateItem(
  _prev: TmaActionState,
  formData: FormData,
): Promise<TmaActionState> {
  const loc = String(formData.get("locationId") ?? "");
  const box = String(formData.get("boxId") ?? "");

  const parsed = quickItemSchema.safeParse({
    name: formData.get("name"),
    brand: String(formData.get("brand") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
    locationId: loc === "" ? null : loc,
    boxId: box === "" ? null : box,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Ошибка",
    };
  }

  const household = await getActiveHousehold();
  if (!household) {
    return { ok: false, message: "Сначала создайте дом в веб-версии" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const status = parsed.data.boxId ? "in_box" : "in_use";

  const { data, error } = await supabase
    .from("items")
    .insert({
      household_id: household.id,
      name: parsed.data.name,
      brand: parsed.data.brand ?? null,
      notes: parsed.data.notes ?? null,
      location_id: parsed.data.locationId,
      box_id: parsed.data.boxId,
      status,
      currency: household.currency,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const id = (data as { id: string }).id;
  revalidatePath("/tma");
  revalidatePath("/app");
  redirect(`/tma/items/${id}`);
}
