import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  DOCUMENT_TYPE_LABELS,
  type Document,
  type DocumentType,
} from "@/entities/document/model/types";
import type { Box } from "@/entities/box/model/types";
import type { Item } from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { getDocumentSignedUrl } from "@/features/document/api/actions";
import { DeleteDocumentButton } from "@/features/document/ui/delete-document-button";
import { QrCodeCard } from "@/features/qr/ui/qr-code-card";
import { formatFileSize, isImageMime, isPdfMime } from "@/shared/lib/files";
import { createClient } from "@/shared/api/supabase/server";
import { qrDeepLink } from "@/shared/lib/app-url";
import { getActiveHousehold } from "@/shared/lib/household";

type Props = { params: Promise<{ id: string }> };

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .maybeSingle();

  const doc = row as Document | null;
  if (!doc) notFound();

  const signedUrl = await getDocumentSignedUrl(doc.storage_path);

  const [{ data: locRow }, { data: itemRow }, { data: boxRow }] =
    await Promise.all([
      doc.original_location_id
        ? supabase
            .from("storage_locations")
            .select("id, name")
            .eq("id", doc.original_location_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      doc.item_id
        ? supabase
            .from("items")
            .select("id, name")
            .eq("id", doc.item_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      doc.box_id
        ? supabase
            .from("boxes")
            .select("id, code, name")
            .eq("id", doc.box_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const original = locRow as Pick<StorageLocation, "id" | "name"> | null;
  const item = itemRow as Pick<Item, "id" | "name"> | null;
  const box = boxRow as Pick<Box, "id" | "code" | "name"> | null;

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/app/documents"
            className="text-sm text-muted hover:text-foreground"
          >
            ← Документы
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
          <p className="text-sm text-muted">
            {DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ?? doc.type} ·{" "}
            {formatFileSize(doc.file_size)} · {doc.mime_type}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
            >
              Открыть / скачать
            </a>
          ) : null}
          <DeleteDocumentButton id={doc.id} />
        </div>
      </div>

      <dl className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <Field
          label="Бумажный оригинал"
          value={original?.name ?? "Не указано"}
          href={original ? `/app/locations/${original.id}` : undefined}
        />
        <Field label="Дата документа" value={doc.issued_at} />
        <Field
          label="Вещь"
          value={item?.name}
          href={item ? `/app/items/${item.id}` : undefined}
        />
        <Field
          label="Коробка"
          value={
            box ? `${box.code}${box.name ? ` — ${box.name}` : ""}` : null
          }
          href={box ? `/app/boxes/${box.id}` : undefined}
        />
      </dl>

      {doc.qr_token ? (
        <QrCodeCard
          token={doc.qr_token}
          deepLink={qrDeepLink(doc.qr_token)}
          title={doc.title}
          entityType="document"
          compact
        />
      ) : null}

      {doc.notes ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-medium tracking-wide text-muted uppercase">
            Заметки
          </h2>
          <p className="text-sm whitespace-pre-wrap">{doc.notes}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          Просмотр
        </h2>
        {!signedUrl ? (
          <p className="text-sm text-muted">Не удалось получить ссылку на файл.</p>
        ) : isImageMime(doc.mime_type) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signedUrl}
            alt={doc.title}
            className="max-h-[70vh] w-full rounded-2xl border border-border object-contain bg-card"
          />
        ) : isPdfMime(doc.mime_type) ? (
          <iframe
            title={doc.title}
            src={signedUrl}
            className="h-[70vh] w-full rounded-2xl border border-border bg-card"
          />
        ) : (
          <p className="text-sm text-muted">
            Предпросмотр для этого формата недоступен. Откройте файл кнопкой
            выше (HEIC на некоторых устройствах откроется в галерее).
          </p>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const display = value == null || value === "" ? "—" : value;
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-all">
        {href && display !== "—" ? (
          <Link href={href} className="underline-offset-4 hover:underline">
            {display}
          </Link>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}
