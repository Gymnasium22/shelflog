"use client";

import { QRCodeSVG } from "qrcode.react";

import {
  QR_ENTITY_LABELS,
  type QrEntityType,
} from "@/shared/lib/app-url";
import { Button } from "@/shared/ui/button";

export function PrintQrClient({
  title,
  deepLink,
  entityType,
}: {
  title: string;
  deepLink: string;
  entityType: QrEntityType;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="print:hidden">
        <Button type="button" onClick={() => window.print()}>
          Печать
        </Button>
      </div>
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-white p-8 text-black shadow-sm">
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          ShelfLog · {QR_ENTITY_LABELS[entityType]}
        </p>
        <h1 className="text-center text-lg font-semibold">{title}</h1>
        <QRCodeSVG value={deepLink} size={260} level="M" includeMargin />
        <p className="text-center text-[11px] break-all text-neutral-600">
          {deepLink}
        </p>
      </div>
    </div>
  );
}
