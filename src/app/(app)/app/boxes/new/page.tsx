import Link from "next/link";
import { redirect } from "next/navigation";

import type { StorageLocation } from "@/entities/location/model/types";
import { CreateBoxForm } from "@/features/box/ui/create-box-form";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Новая коробка" };

export default async function NewBoxPage() {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const { data } = await supabase
    .from("storage_locations")
    .select("*")
    .eq("household_id", household.id)
    .order("path");

  const locations = (data as StorageLocation[] | null) ?? [];

  return (
    <main className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Link
          href="/app/boxes"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Коробки
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Новая коробка</h1>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <CreateBoxForm locations={locations} />
      </div>
    </main>
  );
}
