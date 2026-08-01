import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LOCATION_TYPE_LABELS,
  type StorageLocation,
} from "@/entities/location/model/types";
import { CreateLocationForm } from "@/features/location/ui/create-location-form";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Места хранения" };

export default async function LocationsPage() {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const { data } = await supabase
    .from("storage_locations")
    .select("*")
    .eq("household_id", household.id)
    .order("path", { ascending: true });

  const locations = (data as StorageLocation[] | null) ?? [];

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Места хранения
        </h1>
        <p className="text-sm text-muted">
          Дерево: дом → комната → шкаф → полка → папка…
        </p>
      </div>

      <CreateLocationForm locations={locations} />

      <section className="space-y-2">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          Дерево ({locations.length})
        </h2>
        {locations.length === 0 ? (
          <p className="text-sm text-muted">Пока пусто — создайте дом заново или добавьте место.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {locations.map((loc) => (
              <li key={loc.id}>
                <Link
                  href={`/app/locations/${loc.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-border/20"
                  style={{ paddingLeft: `${16 + loc.depth * 16}px` }}
                >
                  <div>
                    <p className="font-medium">{loc.name}</p>
                    <p className="text-xs text-muted">
                      {LOCATION_TYPE_LABELS[loc.type] ?? loc.type}
                    </p>
                  </div>
                  <span className="text-xs text-muted">depth {loc.depth}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
