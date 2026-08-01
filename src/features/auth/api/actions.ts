"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/shared/api/supabase/server";
import {
  loginSchema,
  magicLinkSchema,
  signupSchema,
} from "@/features/auth/model/schemas";

export type AuthActionState = {
  ok: boolean;
  message: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
};

function emptyOk(): AuthActionState {
  return { ok: true, message: null };
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function safeNextPath(raw: FormDataEntryValue | null): string {
  const next = typeof raw === "string" ? raw : "";
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }
  return next;
}

export async function signInWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте поля формы",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      ok: false,
      message: mapAuthError(error.message),
    };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signUpWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте поля формы",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
        locale: "ru",
      },
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/app`,
    },
  });

  if (error) {
    return {
      ok: false,
      message: mapAuthError(error.message),
    };
  }

  // If email confirmation is disabled, session is returned immediately.
  if (data.session) {
    redirect(safeNextPath(formData.get("next")));
  }

  return {
    ok: true,
    message:
      "Мы отправили письмо для подтверждения. Откройте ссылку — и войдёте в ShelfLog.",
  };
}

export async function signInWithMagicLink(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте email",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      ok: false,
      message: mapAuthError(error.message),
    };
  }

  return {
    ok: true,
    message:
      "Ссылка для входа отправлена на почту. Откройте письмо и нажмите кнопку.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Неверный email или пароль";
  }
  if (lower.includes("user already registered")) {
    return "Этот email уже зарегистрирован — войдите или используйте magic link";
  }
  if (lower.includes("email not confirmed")) {
    return "Email ещё не подтверждён. Проверьте почту или запросите magic link";
  }
  if (lower.includes("rate limit") || lower.includes("security purposes")) {
    return "Слишком много попыток. Подождите минуту и попробуйте снова";
  }

  return message;
}

export async function getEmptyAuthState(): Promise<AuthActionState> {
  return emptyOk();
}
