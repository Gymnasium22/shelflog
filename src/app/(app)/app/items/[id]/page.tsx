import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { Box } from "@/entities/box/model/types";
import {
  DOCUMENT_TYPE_LABELS,
  type Document,
  type DocumentType,
} from "@/entities/document/model/types";
import {
  ITEM_STATUS_LABELS,
  type Item,
  type ItemStatus,
} from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { QrCodeCard } from "@/features/qr/ui/qr-code-card";
import { createClient } from "@/shared/api/supabase/server";
import { qrDeepLink } from "@/shared/lib/app-url";
import { getActiveHousehold } from "@/shared/lib/household";

type Props = { params: Promise<{ id: string }> };

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const { data: itemRow } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .maybeSingle();

  const item = itemRow as Item | null;
  if (!item) notFound();

  const [
    { data: locRow },
    { data: docsLocRow },
    { data: boxRow },
    { data: docsRows },
  ] = await Promise.all([
    item.location_id
      ? supabase
          .from("storage_locations")
          .select("id, name")
          .eq("id", item.location_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    item.documents_original_location_id
      ? supabase
          .from("storage_locations")
          .select("id, name")
          .eq("id", item.documents_original_location_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    item.box_id
      ? supabase
          .from("boxes")
          .select("id, code, name")
          .eq("id", item.box_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("documents")
      .select("id, title, type, created_at")
      .eq("item_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const location = locRow as Pick<StorageLocation, "id" | "name"> | null;
  const docsLocation = docsLocRow as Pick<
    StorageLocation,
    "id" | "name"
  > | null;
  const box = boxRow as Pick<Box, "id" | "code" | "name"> | null;
  const documents =
    (docsRows as Pick<Document, "id" | "title" | "type" | "created_at">[] | null) ??
    [];

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/app/items"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Вещи
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{item.name}</h1>
        <p className="text-sm text-muted">
          {ITEM_STATUS_LABELS[item.status as ItemStatus] ?? item.status}
          {item.brand || item.model
            ? ` · ${[item.brand, item.model].filter(Boolean).join(" ")}`
            : ""}
        </p>
      </div>

      <dl className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <Field label="Категория" value={item.category} />
        <Field label="Серийный номер" value={item.serial_number} />
        <Field
          label="Цена"
          value={
            item.purchase_price != null
              ? `${item.purchase_price} ${item.currency ?? household.currency}`
              : null
          }
        />
        <Field label="Дата покупки" value={item.purchased_at} />
        <Field label="Магазин" value={item.store_name} />
        <Field
          label="Гарантия"
          value={
            item.warranty_until
              ? `до ${item.warranty_until}`
              : item.warranty_months != null
                ? `${item.warranty_months} мес.`
                : null
          }
        />
        <Field
          label="Место хранения"
          value={location?.name}
          href={location ? `/app/locations/${location.id}` : undefined}
        />
        <Field
          label="Коробка"
          value={
            box ? `${box.code}${box.name ? ` — ${box.name}` : ""}` : null
          }
          href={box ? `/app/boxes/${box.id}` : undefined}
        />
        <Field
          label="Оригиналы документов"
          value={docsLocation?.name}
          href={
            docsLocation ? `/app/locations/${docsLocation.id}` : undefined
          }
        />
      </dl>

      <QrCodeCard
        token={item.qr_token}
        deepLink={qrDeepLink(item.qr_token)}
        title={item.name}
        entityType="item"
      />

      {item.notes ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-medium tracking-wide text-muted uppercase">
            Заметки
          </h2>
          <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            Документы ({documents.length})
          </h2>
          <Link
            href={`/app/documents/new?itemId=${item.id}`}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Прикрепить
          </Link>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-muted">
            Чеки, инструкции, гарантии — с указанием, где лежит оригинал.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/app/documents/${doc.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-border/20"
                >
                  <span className="font-medium">{doc.title}</span>
                  <span className="text-xs text-muted">
                    {DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ?? doc.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
  value: string | number | null | undefined;
  href?: string;
}) {
  const display = value == null || value === "" ? "—" : String(value);
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
