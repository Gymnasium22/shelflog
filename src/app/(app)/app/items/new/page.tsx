import Link from "next/link";
import { redirect } from "next/navigation";

import type { Box } from "@/entities/box/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { CreateItemForm } from "@/features/item/ui/create-item-form";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Новая вещь" };

export default async function NewItemPage() {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const [{ data: locRows }, { data: boxRows }] = await Promise.all([
    supabase
      .from("storage_locations")
      .select("*")
      .eq("household_id", household.id)
      .order("path"),
    supabase
      .from("boxes")
      .select("*")
      .eq("household_id", household.id)
      .order("code"),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/app/items"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Вещи
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Новая вещь</h1>
        <p className="text-sm text-muted">
          Паспорт: где лежит, гарантия, оригиналы документов.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <CreateItemForm
          locations={(locRows as StorageLocation[] | null) ?? []}
          boxes={(boxRows as Box[] | null) ?? []}
        />
      </div>
    </main>
  );
}
