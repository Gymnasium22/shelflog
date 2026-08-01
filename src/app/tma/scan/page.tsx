"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { QrScanner } from "@/features/qr/ui/qr-scanner";
import { Button } from "@/shared/ui/button";

/**
 * TMA scan page reuses web scanner.
 * After resolve, /q/[token] opens web cards; for items we can stay in TMA via manual paste.
 */
export default function TmaScanPage() {
  const router = useRouter();
  const [manual, setManual] = useState("");
  const ready = useRef(false);

  useEffect(() => {
    ready.current = true;
    const wa = window.Telegram?.WebApp;
    wa?.BackButton?.show();
    const onBack = () => router.push("/tma");
    wa?.BackButton?.onClick(onBack);
    return () => {
      wa?.BackButton?.offClick(onBack);
      wa?.BackButton?.hide();
    };
  }, [router]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Сканер QR</h1>
      <p className="text-sm text-muted">
        Наведите камеру на код ShelfLog или вставьте ссылку.
      </p>
      <QrScanner />
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = manual.trim();
          if (!t) return;
          // Prefer TMA item deep links if raw uuid-ish token path
          if (t.includes("/q/")) {
            router.push(t.startsWith("http") ? `/q/${t.split("/q/")[1]}` : t);
            return;
          }
          router.push(`/q/${encodeURIComponent(t)}`);
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Ссылка /q/… или token"
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
        />
        <Button type="submit" variant="secondary" className="w-full">
          Открыть
        </Button>
      </form>
    </div>
  );
}
