export const LOCATION_TYPES = [
  "home",
  "room",
  "zone",
  "cabinet",
  "shelf",
  "drawer",
  "folder",
  "other",
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export type StorageLocation = {
  id: string;
  household_id: string;
  parent_id: string | null;
  name: string;
  type: LocationType;
  description: string | null;
  color: string | null;
  icon: string | null;
  path: string;
  depth: number;
  sort_order: number;
  qr_token: string;
  created_at: string;
  updated_at: string;
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  home: "Дом",
  room: "Комната",
  zone: "Зона",
  cabinet: "Шкаф",
  shelf: "Полка",
  drawer: "Ящик",
  folder: "Папка",
  other: "Другое",
};
