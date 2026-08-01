"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import Link from "next/link";

import {
  QR_ENTITY_LABELS,
  type QrEntityType,
} from "@/shared/lib/app-url";
import { Button } from "@/shared/ui/button";

type Props = {
  token: string;
  deepLink: string;
  title: string;
  entityType: QrEntityType;
  compact?: boolean;
};

export function QrCodeCard({
  token,
  deepLink,
  title,
  entityType,
  compact = false,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const node = printRef.current;
    if (!node) return;

    const win = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
    if (!win) {
      window.print();
      return;
    }

    win.document.write(`<!doctype html><html><head><title>QR · ${title}</title>
      <style>
        body { font-family: system-ui, sans-serif; display:flex; flex-direction:column;
          align-items:center; justify-content:center; min-height:100vh; margin:0; gap:12px; }
        h1 { font-size: 18px; margin: 0; text-align: center; max-width: 280px; }
        p { font-size: 12px; color: #666; margin: 0; text-align: center; word-break: break-all; max-width: 280px; }
        svg { width: 240px; height: 240px; }
      </style></head><body>
      ${node.innerHTML}
      <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    win.document.close();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(deepLink);
      alert("Ссылка скопирована");
    } catch {
      prompt("Скопируйте ссылку:", deepLink);
    }
  }

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-border bg-card p-4"
          : "rounded-2xl border border-border bg-card p-5"
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            QR-код · {QR_ENTITY_LABELS[entityType]}
          </h2>
          <p className="text-xs text-muted">
            Распечатайте и наклейте на объект
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={copyLink}>
            Копировать ссылку
          </Button>
          <Button type="button" variant="secondary" onClick={handlePrint}>
            Печать
          </Button>
          <Link
            href={`/app/qr/print?token=${encodeURIComponent(token)}&title=${encodeURIComponent(title)}&type=${entityType}`}
            className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium"
          >
            Лист для печати
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div
          ref={printRef}
          className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-black"
        >
          <h1 className="max-w-[220px] text-center text-sm font-semibold">
            {title}
          </h1>
          <QRCodeSVG
            value={deepLink}
            size={compact ? 140 : 180}
            level="M"
            includeMargin
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
          <p className="max-w-[220px] text-center text-[10px] break-all text-neutral-600">
            {deepLink}
          </p>
        </div>
        <div className="space-y-2 text-sm text-muted">
          <p>
            После сканирования откроется карточка объекта (нужен вход в
            ShelfLog).
          </p>
          <p className="font-mono text-xs break-all text-foreground/80">
            token: {token}
          </p>
        </div>
      </div>
    </section>
  );
}
