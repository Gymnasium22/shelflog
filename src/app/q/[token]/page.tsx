import Link from "next/link";
import { redirect } from "next/navigation";

import { resolveQrToken } from "@/features/qr/api/resolve";
import { pathForQrEntity, type QrEntityType } from "@/shared/lib/app-url";
import { createClient } from "@/shared/api/supabase/server";

type Props = { params: Promise<{ token: string }> };

export const metadata = {
  title: "QR",
};

export default async function QrResolvePage({ params }: Props) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/q/${token}`)}`);
  }

  const { data, error } = await resolveQrToken(token);

  if (data) {
    redirect(pathForQrEntity(data.entity_type as QrEntityType, data.entity_id));
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          ShelfLog QR
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Не удалось открыть объект
        </h1>
        <p className="text-sm text-muted">
          {error && error !== "auth_required"
            ? error
            : "Проверьте код или доступ к дому."}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/scan"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
        >
          Сканировать снова
        </Link>
        <Link
          href="/app"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium"
        >
          На главную
        </Link>
      </div>
      <p className="font-mono text-xs break-all text-muted">token: {token}</p>
    </main>
  );
}
