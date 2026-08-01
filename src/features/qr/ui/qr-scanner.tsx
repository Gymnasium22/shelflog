"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

function extractTokenFromScan(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/q\/([^/]+)\/?$/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    // not a URL — maybe raw token
  }

  // raw token (hex-ish)
  if (/^[a-fA-F0-9]{16,64}$/.test(trimmed)) {
    return trimmed;
  }

  // path-only /q/token
  const pathMatch = trimmed.match(/\/q\/([a-fA-F0-9]+)/);
  if (pathMatch?.[1]) return pathMatch[1];

  return null;
}

export function QrScanner() {
  const router = useRouter();
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const handlingRef = useRef(false);

  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      if (s?.isScanning) {
        void s.stop().catch(() => undefined);
      }
      scannerRef.current = null;
    };
  }, []);

  async function start() {
    setError(null);
    handlingRef.current = false;

    try {
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          if (handlingRef.current) return;
          const token = extractTokenFromScan(decoded);
          if (!token) {
            setError("Не похоже на QR ShelfLog");
            return;
          }
          handlingRef.current = true;
          try {
            if (scanner.isScanning) await scanner.stop();
          } catch {
            // ignore
          }
          setActive(false);
          router.push(`/q/${encodeURIComponent(token)}`);
        },
        () => {
          // ignore frame errors
        },
      );
      setActive(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось открыть камеру. Разрешите доступ или введите код вручную.",
      );
      setActive(false);
    }
  }

  async function stop() {
    const s = scannerRef.current;
    if (s?.isScanning) {
      try {
        await s.stop();
      } catch {
        // ignore
      }
    }
    setActive(false);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const token = extractTokenFromScan(manual) ?? manual.trim();
    if (!token) {
      setError("Введите токен или ссылку /q/…");
      return;
    }
    router.push(`/q/${encodeURIComponent(token)}`);
  }

  return (
    <div className="space-y-4">
      <div
        id={regionId}
        className="overflow-hidden rounded-2xl border border-border bg-black/90 min-h-[240px]"
      />

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button type="button" onClick={() => void start()}>
            Включить камеру
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => void stop()}>
            Остановить
          </Button>
        )}
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <form onSubmit={submitManual} className="space-y-2">
        <label htmlFor="manual-token" className="text-sm font-medium">
          Или вставьте ссылку / токен
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="manual-token"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="http://localhost:3000/q/… или token"
            className="h-11 min-w-[12rem] flex-1 rounded-xl border border-border bg-card px-3 text-sm"
          />
          <Button type="submit" variant="secondary">
            Открыть
          </Button>
        </div>
      </form>
    </div>
  );
}
