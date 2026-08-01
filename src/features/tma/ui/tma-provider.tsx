"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type TmaUser = {
  id: string;
  email: string;
  displayName: string;
  telegramId: number;
};

type TmaContextValue = {
  status: "loading" | "ready" | "error" | "no-telegram";
  error: string | null;
  user: TmaUser | null;
  retry: () => void;
};

const TmaContext = createContext<TmaContextValue | null>(null);

export function useTma() {
  const ctx = useContext(TmaContext);
  if (!ctx) throw new Error("useTma must be used within TmaProvider");
  return ctx;
}

function applyTelegramTheme(webApp: TelegramWebApp) {
  const root = document.documentElement;
  const tp = webApp.themeParams;
  if (tp.bg_color) root.style.setProperty("--background", tp.bg_color);
  if (tp.text_color) root.style.setProperty("--foreground", tp.text_color);
  if (tp.hint_color) root.style.setProperty("--muted", tp.hint_color);
  if (tp.secondary_bg_color) root.style.setProperty("--card", tp.secondary_bg_color);
  if (tp.button_color) root.style.setProperty("--accent", tp.button_color);
  if (tp.button_text_color)
    root.style.setProperty("--accent-foreground", tp.button_text_color);
  if (tp.section_separator_color || tp.hint_color) {
    root.style.setProperty(
      "--border",
      tp.section_separator_color || tp.hint_color || "#e5e5e5",
    );
  }
  root.dataset.tgColorScheme = webApp.colorScheme;
}

async function loadTelegramScript(): Promise<void> {
  if (window.Telegram?.WebApp) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-telegram-web-app]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Telegram script failed")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.dataset.telegramWebApp = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить Telegram SDK"));
    document.head.appendChild(script);
  });
}

export function TmaProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] =
    useState<TmaContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<TmaUser | null>(null);
  const [tick, setTick] = useState(0);

  const authenticate = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      await loadTelegramScript();
      const webApp = window.Telegram?.WebApp;

      if (!webApp) {
        setStatus("no-telegram");
        setError(
          "Откройте это окно внутри Telegram как Mini App, либо настройте бота.",
        );
        return;
      }

      webApp.ready();
      webApp.expand();
      applyTelegramTheme(webApp);

      const initData = webApp.initData;
      if (!initData) {
        // Dev outside Telegram: allow browsing shell without session
        if (process.env.NODE_ENV === "development") {
          setStatus("no-telegram");
          setError(
            "Нет initData. Для dev: откройте через бота или добавьте TELEGRAM_BOT_TOKEN и реальный Mini App.",
          );
          return;
        }
        setStatus("error");
        setError("Telegram не передал initData");
        return;
      }

      const res = await fetch("/api/tma/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        message?: string;
        user?: TmaUser;
      };

      if (!res.ok || !json.ok || !json.user) {
        setStatus("error");
        setError(json.message ?? "Ошибка входа через Telegram");
        return;
      }

      setUser(json.user);
      setStatus("ready");
      webApp.HapticFeedback?.notificationOccurred("success");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Ошибка TMA");
    }
  }, []);

  useEffect(() => {
    void authenticate();
  }, [authenticate, tick]);

  const value = useMemo<TmaContextValue>(
    () => ({
      status,
      error,
      user,
      retry: () => setTick((t) => t + 1),
    }),
    [status, error, user],
  );

  return <TmaContext.Provider value={value}>{children}</TmaContext.Provider>;
}
