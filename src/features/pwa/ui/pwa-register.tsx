"use client";

import { useEffect } from "react";

/**
 * Registers the Serwist service worker in production builds.
 * Disabled in development (see next.config Serwist `disable`).
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // SW optional — app works without it
      });
  }, []);

  return null;
}
