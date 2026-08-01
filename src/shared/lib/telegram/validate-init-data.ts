import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type ValidatedTelegramInit = {
  user: TelegramWebAppUser;
  authDate: number;
  raw: Record<string, string>;
};

/**
 * Validates Telegram Mini App `initData` per Telegram WebApp docs (HMAC-SHA256).
 * Free / no third-party auth SaaS.
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 60 * 60 * 24,
): ValidatedTelegramInit {
  if (!initData?.trim()) {
    throw new Error("Пустой initData");
  }
  if (!botToken?.trim()) {
    throw new Error("TELEGRAM_BOT_TOKEN не настроен");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new Error("Нет hash в initData");
  }

  const entries: string[] = [];
  params.forEach((value, key) => {
    if (key !== "hash") {
      entries.push(`${key}=${value}`);
    }
  });
  entries.sort();
  const dataCheckString = entries.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Подпись initData недействительна");
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number(authDateRaw) : 0;
  if (!authDate || Number.isNaN(authDate)) {
    throw new Error("Некорректный auth_date");
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) {
    throw new Error("initData устарел — перезапустите Mini App");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw new Error("В initData нет user");
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    throw new Error("Некорректный user JSON");
  }

  if (!user?.id) {
    throw new Error("Нет telegram user id");
  }

  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    raw[key] = value;
  });

  return { user, authDate, raw };
}

export function telegramSyntheticEmail(telegramId: number): string {
  return `tg_${telegramId}@telegram.shelflog.local`;
}

export function displayNameFromTelegram(user: TelegramWebAppUser): string {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (user.username) return `@${user.username}`;
  return `Telegram ${user.id}`;
}
