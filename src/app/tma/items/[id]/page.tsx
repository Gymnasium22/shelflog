import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ITEM_STATUS_LABELS,
  type Item,
  type ItemStatus,
} from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import type { Box } from "@/entities/box/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

type Props = { params: Promise<{ id: string }> };

export default async function TmaItemPage({ params }: Props) {
  const { id } = await params;
  const household = await getActiveHousehold();
  if (!household) {
    return <p className="text-sm text-muted">Нет дома</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .maybeSingle();

  const item = data as Item | null;
  if (!item) notFound();

  const [{ data: loc }, { data: box }] = await Promise.all([
    item.location_id
      ? supabase
          .from("storage_locations")
          .select("id, name")
          .eq("id", item.location_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    item.box_id
      ? supabase
          .from("boxes")
          .select("id, code, name")
          .eq("id", item.box_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const location = loc as Pick<StorageLocation, "id" | "name"> | null;
  const boxRow = box as Pick<Box, "id" | "code" | "name"> | null;

  return (
    <div className="space-y-4">
      <Link href="/tma" className="text-sm text-muted">
        ← Назад
      </Link>
      <div>
        <h1 className="text-xl font-semibold">{item.name}</h1>
        <p className="text-sm text-muted">
          {ITEM_STATUS_LABELS[item.status as ItemStatus] ?? item.status}
          {item.brand ? ` · ${item.brand}` : ""}
          {item.model ? ` ${item.model}` : ""}
        </p>
      </div>
      <dl className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
        <Row label="Серийный" value={item.serial_number} />
        <Row label="Место" value={location?.name} />
        <Row
          label="Коробка"
          value={
            boxRow
              ? `${boxRow.code}${boxRow.name ? ` — ${boxRow.name}` : ""}`
              : null
          }
        />
        <Row
          label="Гарантия до"
          value={item.warranty_until}
        />
        <Row label="Заметки" value={item.notes} />
      </dl>
      <Link
        href={`/app/items/${item.id}`}
        className="inline-flex text-sm font-medium underline-offset-4 hover:underline"
      >
        Открыть полную карточку
      </Link>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium break-all">{value || "—"}</dd>
    </div>
  );
}
