export const ITEM_STATUSES = [
  "in_use",
  "sold",
  "in_repair",
  "lent",
  "gifted",
  "discarded",
  "lost",
  "in_box",
  "in_storage",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type Item = {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_price: number | null;
  currency: string | null;
  purchased_at: string | null;
  store_name: string | null;
  warranty_months: number | null;
  warranty_until: string | null;
  location_id: string | null;
  box_id: string | null;
  documents_original_location_id: string | null;
  status: ItemStatus;
  notes: string | null;
  qr_token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  in_use: "Используется",
  sold: "Продано",
  in_repair: "На ремонте",
  lent: "Отдано",
  gifted: "Подарено",
  discarded: "Выброшено",
  lost: "Утеряно",
  in_box: "В коробке",
  in_storage: "В кладовке",
};

/** Statuses counted in total property value. */
export const ACTIVE_VALUE_STATUSES: ItemStatus[] = [
  "in_use",
  "in_box",
  "in_storage",
  "in_repair",
  "lent",
];
