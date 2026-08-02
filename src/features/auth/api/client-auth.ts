"use client";

import { createClient } from "@/shared/api/supabase/client";
import {
  getAppUrl,
  invalidFormState,
  mapAuthError,
  parseLoginForm,
  parseMagicLinkForm,
  parseSignupForm,
  safeNextPath,
  type AuthActionState,
} from "@/features/auth/api/auth-shared";

export type { AuthActionState };

export async function signInWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseLoginForm(formData);

  if (!parsed.success) {
    return invalidFormState(
      "Проверьте поля формы",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, message: mapAuthError(error.message) };
  }

  return {
    ok: true,
    message: null,
    redirectTo: safeNextPath(formData.get("next")),
  } as AuthActionState & { redirectTo?: string };
}

export async function signUpWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseSignupForm(formData);

  if (!parsed.success) {
    return invalidFormState(
      "Проверьте поля формы",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = createClient();
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
    return { ok: false, message: mapAuthError(error.message) };
  }

  if (data.session) {
    return {
      ok: true,
      message: null,
      redirectTo: safeNextPath(formData.get("next")),
    } as AuthActionState & { redirectTo?: string };
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
  const parsed = parseMagicLinkForm(formData);

  if (!parsed.success) {
    return invalidFormState(
      "Проверьте email",
      parsed.error.flatten().fieldErrors,
    );
  }

  const next = safeNextPath(formData.get("next"));
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, message: mapAuthError(error.message) };
  }

  return {
    ok: true,
    message:
      "Ссылка для входа отправлена на почту. Откройте письмо и нажмите кнопку.",
  };
}

export async function signOutClient() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.assign("/login");
}
