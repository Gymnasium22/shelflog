import { QuickAddForm } from "@/features/tma/ui/quick-add-form";
import type { Box } from "@/entities/box/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export default async function TmaNewItemPage() {
  const household = await getActiveHousehold();
  if (!household) {
    return (
      <p className="text-sm text-muted">
        Сначала создайте дом в полной веб-версии.
      </p>
    );
  }

  const supabase = await createClient();
  const [{ data: locs }, { data: boxes }] = await Promise.all([
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Быстрое добавление</h1>
      <QuickAddForm
        locations={(locs as StorageLocation[] | null) ?? []}
        boxes={(boxes as Box[] | null) ?? []}
      />
    </div>
  );
}
