import type { SupabaseClient } from "@supabase/supabase-js";

import { ACTIVE_VALUE_STATUSES } from "@/entities/item/model/types";
import type { Household } from "@/entities/household/model/types";
import { createClient } from "@/shared/api/supabase/server";
import {
  addDays,
  formatDateTimeRu,
  toDateOnly,
  todayGreetingRu,
} from "@/shared/lib/dates";
import type {
  ActivityRow,
  DashboardBoxRow,
  DashboardData,
  DashboardDocRow,
  DashboardItemRow,
} from "@/widgets/dashboard/model/types";

export async function loadDashboard(
  household: Household,
  supabaseClient?: SupabaseClient,
): Promise<DashboardData> {
  const supabase = supabaseClient ?? (await createClient());
  const hid = household.id;
  const today = toDateOnly();
  const in30 = addDays(today, 30);
  const startOfToday = `${today}T00:00:00.000Z`;

  const [
    itemsCountRes,
    boxesCountRes,
    locationsCountRes,
    documentsCountRes,
    priceRowsRes,
    inRepairCountRes,
    warrantiesExpiringRes,
    warrantiesExpiredRes,
    warrantiesTodayRes,
    itemsTodayRes,
    docsTodayCountRes,
    recentItemsRes,
    recentDocsRes,
    recentBoxesRes,
    inRepairListRes,
  ] = await Promise.all([
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", hid),
    supabase
      .from("boxes")
      .select("*", { count: "exact", head: true })
      .eq("household_id", hid),
    supabase
      .from("storage_locations")
      .select("*", { count: "exact", head: true })
      .eq("household_id", hid),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("household_id", hid),
    supabase
      .from("items")
      .select("purchase_price, status")
      .eq("household_id", hid)
      .in("status", ACTIVE_VALUE_STATUSES),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", hid)
      .eq("status", "in_repair"),
    supabase
      .from("items")
      .select("id, name, status, brand, warranty_until, created_at, updated_at")
      .eq("household_id", hid)
      .not("warranty_until", "is", null)
      .gte("warranty_until", today)
      .lte("warranty_until", in30)
      .order("warranty_until", { ascending: true })
      .limit(8),
    supabase
      .from("items")
      .select("id, name, status, brand, warranty_until, created_at, updated_at")
      .eq("household_id", hid)
      .not("warranty_until", "is", null)
      .lt("warranty_until", today)
      .order("warranty_until", { ascending: false })
      .limit(5),
    supabase
      .from("items")
      .select("id, name, status, brand, warranty_until, created_at, updated_at")
      .eq("household_id", hid)
      .eq("warranty_until", today)
      .limit(10),
    supabase
      .from("items")
      .select("id, name, status, brand, warranty_until, created_at, updated_at")
      .eq("household_id", hid)
      .gte("created_at", startOfToday)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("household_id", hid)
      .gte("created_at", startOfToday),
    supabase
      .from("items")
      .select("id, name, status, brand, warranty_until, created_at, updated_at")
      .eq("household_id", hid)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("documents")
      .select("id, title, type, created_at")
      .eq("household_id", hid)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("boxes")
      .select("id, code, name, created_at")
      .eq("household_id", hid)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("items")
      .select("id, name, status, brand, warranty_until, created_at, updated_at")
      .eq("household_id", hid)
      .eq("status", "in_repair")
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const totalValue = (
    (priceRowsRes.data as
      | { purchase_price: number | null; status: string }[]
      | null) ?? []
  ).reduce((sum, row) => sum + Number(row.purchase_price ?? 0), 0);

  const recentItems =
    (recentItemsRes.data as DashboardItemRow[] | null) ?? [];
  const recentDocuments =
    (recentDocsRes.data as DashboardDocRow[] | null) ?? [];
  const recentBoxes = (recentBoxesRes.data as DashboardBoxRow[] | null) ?? [];

  const activity: ActivityRow[] = [
    ...recentItems.map((i) => ({
      id: `item-${i.id}`,
      kind: "item" as const,
      title: i.name,
      subtitle: `Вещь · ${formatDateTimeRu(i.created_at)}`,
      at: i.created_at,
      href: `/app/items/${i.id}`,
    })),
    ...recentDocuments.map((d) => ({
      id: `doc-${d.id}`,
      kind: "document" as const,
      title: d.title,
      subtitle: `Документ · ${formatDateTimeRu(d.created_at)}`,
      at: d.created_at,
      href: `/app/documents/${d.id}`,
    })),
    ...recentBoxes.map((b) => ({
      id: `box-${b.id}`,
      kind: "box" as const,
      title: b.name ? `${b.code} — ${b.name}` : `Коробка ${b.code}`,
      subtitle: `Коробка · ${formatDateTimeRu(b.created_at)}`,
      at: b.created_at,
      href: `/app/boxes/${b.id}`,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 10);

  return {
    householdName: household.name,
    currency: household.currency,
    counts: {
      items: itemsCountRes.count ?? 0,
      boxes: boxesCountRes.count ?? 0,
      locations: locationsCountRes.count ?? 0,
      documents: documentsCountRes.count ?? 0,
      totalValue,
      inRepair: inRepairCountRes.count ?? 0,
    },
    today: {
      label: todayGreetingRu(),
      warrantiesEndingToday:
        (warrantiesTodayRes.data as DashboardItemRow[] | null) ?? [],
      itemsAddedToday: (itemsTodayRes.data as DashboardItemRow[] | null) ?? [],
      docsAddedToday: docsTodayCountRes.count ?? 0,
    },
    warrantiesExpiring:
      (warrantiesExpiringRes.data as DashboardItemRow[] | null) ?? [],
    warrantiesExpired:
      (warrantiesExpiredRes.data as DashboardItemRow[] | null) ?? [],
    inRepair: (inRepairListRes.data as DashboardItemRow[] | null) ?? [],
    recentItems,
    recentDocuments,
    activity,
  };
}
