"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/shared/api/supabase/server";

export type ActionState = {
  ok: boolean;
  message: string | null;
};

const nameSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(120, "Слишком длинное название");

export async function createHouseholdAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Ошибка" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Нужно войти" };
  }

  const { data, error } = await supabase.rpc("create_household", {
    p_name: parsed.data,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  void data;
  revalidatePath("/app");
  redirect("/app");
}


