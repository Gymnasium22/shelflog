"use client";

import { z } from "zod";

import { createClient } from "@/shared/api/supabase/client";
import type { ActionState } from "@/shared/types/action-state";

export type { ActionState };

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

  const supabase = createClient();
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
  return { ok: true, message: null, redirectTo: "/app" };
}
