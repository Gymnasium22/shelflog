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

export function emptyAuthState(): AuthActionState {
  return { ok: true, message: null };
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function safeNextPath(raw: FormDataEntryValue | null): string {
  const next = typeof raw === "string" ? raw : "";
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }
  return next;
}

export function mapAuthError(message: string): string {
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

export function parseLoginForm(formData: FormData) {
  return loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export function parseSignupForm(formData: FormData) {
  return signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
}

export function parseMagicLinkForm(formData: FormData) {
  return magicLinkSchema.safeParse({
    email: formData.get("email"),
  });
}

export function invalidFormState(
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
): AuthActionState {
  return { ok: false, message, fieldErrors };
}
