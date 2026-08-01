import Link from "next/link";
import { redirect } from "next/navigation";

import { QrScanner } from "@/features/qr/ui/qr-scanner";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Сканер QR" };

export default async function ScanPage() {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  return (
    <main className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Link href="/app" className="text-sm text-muted hover:text-foreground">
          ← Главная
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Сканер QR</h1>
        <p className="text-sm text-muted">
          Наведите камеру на код вещи, коробки, места или документа.
        </p>
      </div>
      <QrScanner />
    </main>
  );
}
