import type { ItemStatus } from "@/entities/item/model/types";

export type DashboardCounts = {
  items: number;
  boxes: number;
  locations: number;
  documents: number;
  totalValue: number;
  inRepair: number;
};

export type DashboardItemRow = {
  id: string;
  name: string;
  status: ItemStatus | string;
  brand: string | null;
  warranty_until: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardDocRow = {
  id: string;
  title: string;
  type: string;
  created_at: string;
};

export type DashboardBoxRow = {
  id: string;
  code: string;
  name: string | null;
  created_at: string;
};

export type ActivityKind = "item" | "document" | "box";

export type ActivityRow = {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  at: string;
  href: string;
};

export type DashboardData = {
  counts: DashboardCounts;
  today: {
    label: string;
    warrantiesEndingToday: DashboardItemRow[];
    itemsAddedToday: DashboardItemRow[];
    docsAddedToday: number;
  };
  warrantiesExpiring: DashboardItemRow[];
  warrantiesExpired: DashboardItemRow[];
  inRepair: DashboardItemRow[];
  recentItems: DashboardItemRow[];
  recentDocuments: DashboardDocRow[];
  activity: ActivityRow[];
  currency: string;
  householdName: string;
};
