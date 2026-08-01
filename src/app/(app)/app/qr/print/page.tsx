import Link from "next/link";
import { redirect } from "next/navigation";

import { PrintQrClient } from "@/features/qr/ui/print-qr-client";
import {
  QR_ENTITY_LABELS,
  qrDeepLink,
  type QrEntityType,
} from "@/shared/lib/app-url";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Печать QR" };

type Props = {
  searchParams: Promise<{
    token?: string;
    title?: string;
    type?: string;
  }>;
};

const TYPES: QrEntityType[] = ["item", "box", "location", "document"];

export default async function QrPrintPage({ searchParams }: Props) {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const sp = await searchParams;
  const token = (sp.token ?? "").trim();
  if (!token) {
    return (
      <main className="space-y-4">
        <p className="text-sm text-muted">Нет токена QR.</p>
        <Link href="/app">На главную</Link>
      </main>
    );
  }

  const type = TYPES.includes(sp.type as QrEntityType)
    ? (sp.type as QrEntityType)
    : "item";
  const title = sp.title?.trim() || "ShelfLog";
  const deepLink = qrDeepLink(token);

  return (
    <main className="space-y-6">
      <div className="print:hidden space-y-2">
        <Link href="/app" className="text-sm text-muted hover:text-foreground">
          ← Назад
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Печать QR · {QR_ENTITY_LABELS[type]}
        </h1>
        <p className="text-sm text-muted">{title}</p>
      </div>
      <PrintQrClient title={title} deepLink={deepLink} entityType={type} />
    </main>
  );
}
