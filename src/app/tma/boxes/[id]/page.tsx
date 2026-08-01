import Link from "next/link";
import { notFound } from "next/navigation";

import type { Box } from "@/entities/box/model/types";
import type { Item } from "@/entities/item/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

type Props = { params: Promise<{ id: string }> };

export default async function TmaBoxPage({ params }: Props) {
  const { id } = await params;
  const household = await getActiveHousehold();
  if (!household) return <p className="text-sm text-muted">Нет дома</p>;

  const supabase = await createClient();
  const { data } = await supabase
    .from("boxes")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .maybeSingle();

  const box = data as Box | null;
  if (!box) notFound();

  const { data: itemsRaw } = await supabase
    .from("items")
    .select("id, name")
    .eq("box_id", id)
    .order("name");

  const items = (itemsRaw as Pick<Item, "id" | "name">[] | null) ?? [];

  return (
    <div className="space-y-4">
      <Link href="/tma" className="text-sm text-muted">
        ← Назад
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Коробка {box.code}</h1>
        {box.name ? <p className="text-sm text-muted">{box.name}</p> : null}
      </div>
      <section className="space-y-2">
        <h2 className="text-xs font-medium text-muted uppercase">
          Содержимое ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Пусто</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/tma/items/${item.id}`}
                  className="block px-3 py-2.5 text-sm font-medium"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
