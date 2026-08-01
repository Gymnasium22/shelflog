import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  LOCATION_TYPE_LABELS,
  type StorageLocation,
} from "@/entities/location/model/types";
import type { Box } from "@/entities/box/model/types";
import type { Item } from "@/entities/item/model/types";
import { QrCodeCard } from "@/features/qr/ui/qr-code-card";
import { createClient } from "@/shared/api/supabase/server";
import { qrDeepLink } from "@/shared/lib/app-url";
import { getActiveHousehold } from "@/shared/lib/household";

type Props = { params: Promise<{ id: string }> };

export default async function LocationDetailPage({ params }: Props) {
  const { id } = await params;
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const { data: locRow } = await supabase
    .from("storage_locations")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .maybeSingle();

  const location = locRow as StorageLocation | null;
  if (!location) notFound();

  const [{ data: childrenRows }, { data: boxesRows }, { data: itemsRows }] =
    await Promise.all([
      supabase
        .from("storage_locations")
        .select("*")
        .eq("parent_id", id)
        .order("sort_order"),
      supabase.from("boxes").select("*").eq("location_id", id),
      supabase.from("items").select("*").eq("location_id", id).order("name"),
    ]);

  const children = (childrenRows as StorageLocation[] | null) ?? [];
  const boxes = (boxesRows as Box[] | null) ?? [];
  const items = (itemsRows as Item[] | null) ?? [];

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/app/locations"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Места
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          {location.name}
        </h1>
        <p className="text-sm text-muted">
          {LOCATION_TYPE_LABELS[location.type]}
        </p>
        {location.description ? (
          <p className="text-sm">{location.description}</p>
        ) : null}
      </div>

      <QrCodeCard
        token={location.qr_token}
        deepLink={qrDeepLink(location.qr_token)}
        title={location.name}
        entityType="location"
        compact
      />

      <Section title={`Внутри (${children.length})`}>
        {children.length === 0 ? (
          <p className="text-sm text-muted">Нет дочерних мест</p>
        ) : (
          <ul className="space-y-1">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/app/locations/${c.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Коробки здесь (${boxes.length})`}>
        {boxes.length === 0 ? (
          <p className="text-sm text-muted">Нет коробок</p>
        ) : (
          <ul className="space-y-1">
            {boxes.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/app/boxes/${b.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {b.code}
                  {b.name ? ` — ${b.name}` : ""}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Вещи здесь (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Нет вещей</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/app/items/${item.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
