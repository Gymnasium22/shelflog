"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    setStandalone(isStandalone);

    const ios =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(ios);

    if (isStandalone) {
      setHidden(true);
      return;
    }

    const dismissed = sessionStorage.getItem("shelflog-pwa-dismiss") === "1";
    if (dismissed) {
      setHidden(true);
    } else if (ios) {
      setHidden(false);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!dismissed) setHidden(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (hidden || standalone) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Установить ShelfLog</p>
          <p className="text-xs text-muted">
            {isIos
              ? "На iPhone: «Поделиться» → «На экран «Домой»»."
              : "Добавьте на домашний экран — как обычное приложение."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10"
            onClick={() => {
              sessionStorage.setItem("shelflog-pwa-dismiss", "1");
              setHidden(true);
            }}
          >
            Позже
          </Button>
          {!isIos && deferred ? (
            <Button
              type="button"
              className="h-10"
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                setDeferred(null);
                setHidden(true);
              }}
            >
              Установить
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
