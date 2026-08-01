"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ITEM_STATUSES, type ItemStatus } from "@/entities/item/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export type ActionState = {
  ok: boolean;
  message: string | null;
};

const itemSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(200),
  category: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  serialNumber: z.string().trim().max(120).optional(),
  purchasePrice: z.coerce.number().nonnegative().optional().nullable(),
  purchasedAt: z.string().optional(),
  storeName: z.string().trim().max(120).optional(),
  warrantyMonths: z.coerce.number().int().nonnegative().optional().nullable(),
  warrantyUntil: z.string().optional(),
  locationId: z.string().uuid().nullable(),
  boxId: z.string().uuid().nullable(),
  documentsOriginalLocationId: z.string().uuid().nullable(),
  status: z.enum(ITEM_STATUSES),
  notes: z.string().trim().max(2000).optional(),
});

function emptyToNull(v: string) {
  return v === "" ? null : v;
}

function emptyToUndef(v: string) {
  return v === "" ? undefined : v;
}

export async function createItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const priceRaw = String(formData.get("purchasePrice") ?? "").trim();
  const warrantyRaw = String(formData.get("warrantyMonths") ?? "").trim();

  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    category: emptyToUndef(String(formData.get("category") ?? "")),
    brand: emptyToUndef(String(formData.get("brand") ?? "")),
    model: emptyToUndef(String(formData.get("model") ?? "")),
    serialNumber: emptyToUndef(String(formData.get("serialNumber") ?? "")),
    purchasePrice: priceRaw === "" ? null : Number(priceRaw),
    purchasedAt: emptyToUndef(String(formData.get("purchasedAt") ?? "")),
    storeName: emptyToUndef(String(formData.get("storeName") ?? "")),
    warrantyMonths: warrantyRaw === "" ? null : Number(warrantyRaw),
    warrantyUntil: emptyToUndef(String(formData.get("warrantyUntil") ?? "")),
    locationId: emptyToNull(String(formData.get("locationId") ?? "")),
    boxId: emptyToNull(String(formData.get("boxId") ?? "")),
    documentsOriginalLocationId: emptyToNull(
      String(formData.get("documentsOriginalLocationId") ?? ""),
    ),
    status: formData.get("status") || "in_use",
    notes: emptyToUndef(String(formData.get("notes") ?? "")),
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let status = parsed.data.status as ItemStatus;
  if (parsed.data.boxId && status === "in_use") {
    status = "in_box";
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      household_id: household.id,
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      brand: parsed.data.brand ?? null,
      model: parsed.data.model ?? null,
      serial_number: parsed.data.serialNumber ?? null,
      purchase_price: parsed.data.purchasePrice ?? null,
      currency: household.currency,
      purchased_at: parsed.data.purchasedAt ?? null,
      store_name: parsed.data.storeName ?? null,
      warranty_months: parsed.data.warrantyMonths ?? null,
      warranty_until: parsed.data.warrantyUntil ?? null,
      location_id: parsed.data.locationId,
      box_id: parsed.data.boxId,
      documents_original_location_id: parsed.data.documentsOriginalLocationId,
      status,
      notes: parsed.data.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const item = data as { id: string };
  revalidatePath("/app/items");
  revalidatePath("/app");
  redirect(`/app/items/${item.id}`);
}

export async function deleteItemAction(id: string): Promise<ActionState> {
  const household = await getActiveHousehold();
  if (!household) return { ok: false, message: "Нет дома" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .eq("household_id", household.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/app/items");
  revalidatePath("/app");
  return { ok: true, message: "Удалено" };
}
