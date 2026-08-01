"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";

/**
 * Free browser Web Push opt-in (when Notification API is available).
 * Full delivery needs VAPID keys + a free sender later — this only stores permission.
 */
export function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  if (!supported) {
    return (
      <p className="text-sm text-muted">
        Push-уведомления в этом браузере недоступны.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">Push-уведомления</h2>
        <p className="mt-1 text-xs text-muted">
          Бесплатно через браузер (Web Push). Сейчас: запрос разрешения.
          Отправка напоминаний — когда подключим VAPID (без платных сервисов).
        </p>
      </div>
      <p className="text-sm">
        Статус:{" "}
        <span className="font-medium">
          {permission === "granted"
            ? "разрешено"
            : permission === "denied"
              ? "запрещено"
              : "не запрошено"}
        </span>
      </p>
      {permission !== "granted" ? (
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            try {
              const result = await Notification.requestPermission();
              setPermission(result);
              if (result === "granted") {
                setMessage(
                  "Разрешение получено. Уведомления заработают после настройки VAPID.",
                );
              } else {
                setMessage("Разрешение не выдано.");
              }
            } catch {
              setMessage("Не удалось запросить разрешение.");
            }
          }}
        >
          Разрешить уведомления
        </Button>
      ) : null}
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
