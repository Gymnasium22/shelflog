import Link from "next/link";
import { redirect } from "next/navigation";

import type { Box } from "@/entities/box/model/types";
import type { Item } from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { CreateDocumentForm } from "@/features/document/ui/create-document-form";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Новый документ" };

type Props = {
  searchParams: Promise<{ itemId?: string; boxId?: string }>;
};

export default async function NewDocumentPage({ searchParams }: Props) {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: locRows }, { data: itemRows }, { data: boxRows }] =
    await Promise.all([
      supabase
        .from("storage_locations")
        .select("*")
        .eq("household_id", household.id)
        .order("path"),
      supabase
        .from("items")
        .select("*")
        .eq("household_id", household.id)
        .order("name"),
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
          href="/app/documents"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Документы
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Загрузить документ
        </h1>
        <p className="text-sm text-muted">
          Сохраните файл и укажите, где лежит оригинал на бумаге.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <CreateDocumentForm
          locations={(locRows as StorageLocation[] | null) ?? []}
          items={(itemRows as Item[] | null) ?? []}
          boxes={(boxRows as Box[] | null) ?? []}
          defaultItemId={sp.itemId ?? null}
          defaultBoxId={sp.boxId ?? null}
        />
      </div>
    </main>
  );
}
