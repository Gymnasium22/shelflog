import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { Box } from "@/entities/box/model/types";
import type { Item } from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { QrCodeCard } from "@/features/qr/ui/qr-code-card";
import { createClient } from "@/shared/api/supabase/server";
import { qrDeepLink } from "@/shared/lib/app-url";
import { getActiveHousehold } from "@/shared/lib/household";

type Props = { params: Promise<{ id: string }> };

export default async function BoxDetailPage({ params }: Props) {
  const { id } = await params;
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const { data: boxRow } = await supabase
    .from("boxes")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .maybeSingle();

  const box = boxRow as Box | null;
  if (!box) notFound();

  const [{ data: itemsRows }, { data: locRow }] = await Promise.all([
    supabase.from("items").select("*").eq("box_id", id).order("name"),
    box.location_id
      ? supabase
          .from("storage_locations")
          .select("id, name")
          .eq("id", box.location_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const items = (itemsRows as Item[] | null) ?? [];
  const location = locRow as Pick<StorageLocation, "id" | "name"> | null;

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/app/boxes"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Коробки
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Коробка {box.code}
        </h1>
        {box.name ? <p className="text-lg text-muted">{box.name}</p> : null}
        <p className="text-sm text-muted">
          Место:{" "}
          {location ? (
            <Link
              href={`/app/locations/${location.id}`}
              className="underline-offset-4 hover:underline"
            >
              {location.name}
            </Link>
          ) : (
            "не указано"
          )}
        </p>
      </div>

      <QrCodeCard
        token={box.qr_token}
        deepLink={qrDeepLink(box.qr_token)}
        title={box.name ? `${box.code} — ${box.name}` : `Коробка ${box.code}`}
        entityType="box"
      />

      {box.description || box.notes ? (
        <section className="rounded-2xl border border-border bg-card p-5 text-sm">
          {box.description ? <p>{box.description}</p> : null}
          {box.notes ? (
            <p className="mt-2 text-muted">{box.notes}</p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            Содержимое ({items.length})
          </h2>
          <Link
            href="/app/items/new"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Добавить вещь
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Пусто</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/app/items/${item.id}`}
                  className="block px-4 py-3 font-medium transition hover:bg-border/20"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
