import ru from "@/shared/i18n/locales/ru.json";

import { DEFAULT_LOCALE } from "@/shared/config/constants";

const catalogs = {
  ru,
} as const;

export type Locale = keyof typeof catalogs;
export type MessageCatalog = (typeof catalogs)[typeof DEFAULT_LOCALE];

/** Minimal dictionary helper until next-intl is wired (Stage 4+). */
export function getMessages(locale: Locale = DEFAULT_LOCALE): MessageCatalog {
  return catalogs[locale] ?? catalogs.ru;
}

export function t(
  catalog: MessageCatalog,
  path: string,
): string {
  const parts = path.split(".");
  let current: unknown = catalog;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : path;
}
