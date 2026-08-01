"use client";

import type { Box } from "@/entities/box/model/types";
import type { Household } from "@/entities/household/model/types";
import type { Item, ItemStatus } from "@/entities/item/model/types";
import type { LocationType, StorageLocation } from "@/entities/location/model/types";
import { DEFAULT_CURRENCY } from "@/shared/config/constants";

const STORAGE_KEY = "shelflog-local-v1";

type LocalDb = {
  household: Household | null;
  locations: StorageLocation[];
  boxes: Box[];
  items: Item[];
};

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function token() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

function load(): LocalDb {
  if (typeof window === "undefined") {
    return { household: null, locations: [], boxes: [], items: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { household: null, locations: [], boxes: [], items: [] };
    return JSON.parse(raw) as LocalDb;
  } catch {
    return { household: null, locations: [], boxes: [], items: [] };
  }
}

function save(db: LocalDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getHousehold(): Household | null {
  return load().household;
}

export function createHousehold(name: string): Household {
  const ts = now();
  const household: Household = {
    id: id(),
    name: name.trim(),
    currency: DEFAULT_CURRENCY,
    created_by: null,
    created_at: ts,
    updated_at: ts,
  };

  const rootLocation: StorageLocation = {
    id: id(),
    household_id: household.id,
    parent_id: null,
    name: household.name,
    type: "home",
    description: null,
    color: null,
    icon: null,
    path: household.name,
    depth: 0,
    sort_order: 0,
    qr_token: token(),
    created_at: ts,
    updated_at: ts,
  };

  save({ household, locations: [rootLocation], boxes: [], items: [] });
  return household;
}

export function listLocations(householdId: string): StorageLocation[] {
  return load()
    .locations.filter((l) => l.household_id === householdId)
    .sort((a, b) => a.path.localeCompare(b.path, "ru"));
}

export function createLocation(input: {
  householdId: string;
  parentId: string | null;
  name: string;
  type: LocationType;
}): StorageLocation {
  const db = load();
  const ts = now();
  const parent = input.parentId
    ? db.locations.find((l) => l.id === input.parentId)
    : null;
  const depth = parent ? parent.depth + 1 : 0;
  const path = parent ? `${parent.path} / ${input.name.trim()}` : input.name.trim();

  const location: StorageLocation = {
    id: id(),
    household_id: input.householdId,
    parent_id: input.parentId,
    name: input.name.trim(),
    type: input.type,
    description: null,
    color: null,
    icon: null,
    path,
    depth,
    sort_order: db.locations.filter((l) => l.parent_id === input.parentId).length,
    qr_token: token(),
    created_at: ts,
    updated_at: ts,
  };

  db.locations.push(location);
  save(db);
  return location;
}

export function listBoxes(householdId: string): Box[] {
  return load()
    .boxes.filter((b) => b.household_id === householdId)
    .sort((a, b) => a.code.localeCompare(b.code, "ru"));
}

export function createBox(input: {
  householdId: string;
  code: string;
  name?: string;
  locationId?: string | null;
}): Box {
  const db = load();
  const ts = now();
  const box: Box = {
    id: id(),
    household_id: input.householdId,
    location_id: input.locationId ?? null,
    code: input.code.trim().toUpperCase(),
    name: input.name?.trim() || null,
    description: null,
    photo_path: null,
    qr_token: token(),
    notes: null,
    created_at: ts,
    updated_at: ts,
  };

  db.boxes.push(box);
  save(db);
  return box;
}

export function listItems(householdId: string): Item[] {
  return load()
    .items.filter((i) => i.household_id === householdId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createItem(input: {
  householdId: string;
  name: string;
  status?: ItemStatus;
}): Item {
  const db = load();
  const ts = now();
  const item: Item = {
    id: id(),
    household_id: input.householdId,
    name: input.name.trim(),
    category: null,
    brand: null,
    model: null,
    serial_number: null,
    purchase_price: null,
    currency: DEFAULT_CURRENCY,
    purchased_at: null,
    store_name: null,
    warranty_months: null,
    warranty_until: null,
    location_id: null,
    box_id: null,
    documents_original_location_id: null,
    status: input.status ?? "in_use",
    notes: null,
    qr_token: token(),
    created_by: null,
    created_at: ts,
    updated_at: ts,
  };

  db.items.push(item);
  save(db);
  return item;
}

export function getCounts(householdId: string) {
  const db = load();
  return {
    locations: db.locations.filter((l) => l.household_id === householdId).length,
    boxes: db.boxes.filter((b) => b.household_id === householdId).length,
    items: db.items.filter((i) => i.household_id === householdId).length,
  };
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY);
}
