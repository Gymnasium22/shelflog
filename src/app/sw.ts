import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Optional free Web Push receive (no paid provider).
// Sending requires VAPID + a free trigger (e.g. manual admin later).
self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data?.json() as {
        title?: string;
        body?: string;
        url?: string;
      };
    } catch {
      return {
        title: "ShelfLog",
        body: event.data?.text() ?? "Напоминание",
      };
    }
  })();

  event.waitUntil(
    self.registration.showNotification(data.title ?? "ShelfLog", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url ?? "/app" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data as { url?: string } | undefined)?.url ?? "/app";
  event.waitUntil(self.clients.openWindow(url));
});
