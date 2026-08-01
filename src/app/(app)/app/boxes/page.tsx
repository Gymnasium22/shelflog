import Link from "next/link";
import { redirect } from "next/navigation";

import type { Box } from "@/entities/box/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Коробки" };

export default async function BoxesPage() {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const [{ data: boxesRows }, { data: locRows }] = await Promise.all([
    supabase
      .from("boxes")
      .select("*")
      .eq("household_id", household.id)
      .order("code"),
    supabase
      .from("storage_locations")
      .select("id, name")
      .eq("household_id", household.id),
  ]);

  const boxes = (boxesRows as Box[] | null) ?? [];
  const locMap = new Map(
    ((locRows as Pick<StorageLocation, "id" | "name">[] | null) ?? []).map(
      (l) => [l.id, l.name],
    ),
  );

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Коробки</h1>
          <p className="text-sm text-muted">
            Отдельная сущность: код, QR, место и содержимое.
          </p>
        </div>
        <Link
          href="/app/boxes/new"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
        >
          Новая коробка
        </Link>
      </div>

      {boxes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted">Коробок пока нет.</p>
          <Link
            href="/app/boxes/new"
            className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            Создать первую
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {boxes.map((box) => (
            <li key={box.id}>
              <Link
                href={`/app/boxes/${box.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-border/20"
              >
                <div>
                  <p className="font-medium">
                    {box.code}
                    {box.name ? (
                      <span className="text-muted"> — {box.name}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    {box.location_id
                      ? locMap.get(box.location_id) ?? "Место"
                      : "Место не указано"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
