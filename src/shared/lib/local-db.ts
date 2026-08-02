"use client";

import type { Box } from "@/entities/box/model/types";
import type { Household } from "@/entities/household/model/types";
import type { Item, ItemStatus } from "@/entities/item/model/types";
import type { LocationType, StorageLocation } from "@/entities/location/model/types";
import { DEFAULT_CURRENCY } from "@/shared/config/constants";

const STORAGE_KEY = "shelflog-local-v1";

export type LocalDb = {
  household: Household | null;
  locations: StorageLocation[];
  boxes: Box[];
  items: Item[];
};

function emptyDb(): LocalDb {
  return { household: null, locations: [], boxes: [], items: [] };
}

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
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return {
      household: parsed.household ?? null,
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      boxes: Array.isArray(parsed.boxes) ? parsed.boxes : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return emptyDb();
  }
}

function save(db: LocalDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getHousehold(): Household | null {
  return load().household;
}

export function createHousehold(name: string): Household {
  const existing = load().household;
  if (existing) {
    throw new Error("Дом уже создан. Очистите данные в настройках, чтобы начать заново.");
  }

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Укажите название дома");

  const ts = now();
  const household: Household = {
    id: id(),
    name: trimmed,
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
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.path.localeCompare(b.path, "ru");
    });
}

export function createLocation(input: {
  householdId: string;
  parentId: string | null;
  name: string;
  type: LocationType;
}): StorageLocation {
  const db = load();
  if (!db.household || db.household.id !== input.householdId) {
    throw new Error("Дом не найден");
  }

  const trimmed = input.name.trim();
  if (!trimmed) throw new Error("Укажите название места");

  // Always nest under an existing location when the tree already has a root.
  let parentId = input.parentId;
  if (!parentId) {
    const root = db.locations.find(
      (l) => l.household_id === input.householdId && l.parent_id === null,
    );
    parentId = root?.id ?? null;
  }

  const parent = parentId
    ? db.locations.find((l) => l.id === parentId)
    : null;
  if (parentId && !parent) throw new Error("Родительское место не найдено");

  const ts = now();
  const depth = parent ? parent.depth + 1 : 0;
  const path = parent ? `${parent.path} / ${trimmed}` : trimmed;

  const location: StorageLocation = {
    id: id(),
    household_id: input.householdId,
    parent_id: parentId,
    name: trimmed,
    type: input.type,
    description: null,
    color: null,
    icon: null,
    path,
    depth,
    sort_order: db.locations.filter((l) => l.parent_id === parentId).length,
    qr_token: token(),
    created_at: ts,
    updated_at: ts,
  };

  db.locations.push(location);
  save(db);
  return location;
}

/** Collect location id + all descendant ids. */
function collectSubtreeIds(locations: StorageLocation[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const loc of locations) {
      if (loc.parent_id && ids.has(loc.parent_id) && !ids.has(loc.id)) {
        ids.add(loc.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function deleteLocation(locationId: string): { ok: true } | { ok: false; message: string } {
  const db = load();
  const loc = db.locations.find((l) => l.id === locationId);
  if (!loc) return { ok: false, message: "Место не найдено" };
  if (loc.parent_id === null) {
    return { ok: false, message: "Корневое место (дом) нельзя удалить" };
  }

  const subtree = collectSubtreeIds(db.locations, locationId);
  db.locations = db.locations.filter((l) => !subtree.has(l.id));
  for (const box of db.boxes) {
    if (box.location_id && subtree.has(box.location_id)) {
      box.location_id = null;
      box.updated_at = now();
    }
  }
  for (const item of db.items) {
    if (item.location_id && subtree.has(item.location_id)) {
      item.location_id = null;
      item.updated_at = now();
    }
  }
  save(db);
  return { ok: true };
}

export function listBoxes(householdId: string): Box[] {
  return load()
    .boxes.filter((b) => b.household_id === householdId)
    .sort((a, b) => a.code.localeCompare(b.code, "ru"));
}

export function isBoxCodeTaken(householdId: string, code: string, exceptId?: string): boolean {
  const normalized = code.trim().toUpperCase();
  return load().boxes.some(
    (b) =>
      b.household_id === householdId &&
      b.code === normalized &&
      b.id !== exceptId,
  );
}

export function createBox(input: {
  householdId: string;
  code: string;
  name?: string;
  locationId?: string | null;
}): Box {
  const db = load();
  if (!db.household || db.household.id !== input.householdId) {
    throw new Error("Дом не найден");
  }

  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("Укажите код коробки");
  if (isBoxCodeTaken(input.householdId, code)) {
    throw new Error(`Код ${code} уже занят`);
  }

  if (input.locationId) {
    const loc = db.locations.find(
      (l) => l.id === input.locationId && l.household_id === input.householdId,
    );
    if (!loc) throw new Error("Место не найдено");
  }

  const ts = now();
  const box: Box = {
    id: id(),
    household_id: input.householdId,
    location_id: input.locationId ?? null,
    code,
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

export function deleteBox(boxId: string): { ok: true } | { ok: false; message: string } {
  const db = load();
  const box = db.boxes.find((b) => b.id === boxId);
  if (!box) return { ok: false, message: "Коробка не найдена" };

  db.boxes = db.boxes.filter((b) => b.id !== boxId);
  for (const item of db.items) {
    if (item.box_id === boxId) {
      item.box_id = null;
      if (item.status === "in_box") item.status = "in_use";
      item.updated_at = now();
    }
  }
  save(db);
  return { ok: true };
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
  locationId?: string | null;
  boxId?: string | null;
}): Item {
  const db = load();
  if (!db.household || db.household.id !== input.householdId) {
    throw new Error("Дом не найден");
  }

  const trimmed = input.name.trim();
  if (!trimmed) throw new Error("Укажите название вещи");

  if (input.locationId) {
    const loc = db.locations.find(
      (l) => l.id === input.locationId && l.household_id === input.householdId,
    );
    if (!loc) throw new Error("Место не найдено");
  }
  if (input.boxId) {
    const box = db.boxes.find(
      (b) => b.id === input.boxId && b.household_id === input.householdId,
    );
    if (!box) throw new Error("Коробка не найдена");
  }

  let status = input.status ?? "in_use";
  if (input.boxId && status === "in_use") status = "in_box";

  const ts = now();
  const item: Item = {
    id: id(),
    household_id: input.householdId,
    name: trimmed,
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
    location_id: input.locationId ?? null,
    box_id: input.boxId ?? null,
    documents_original_location_id: null,
    status,
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

export function deleteItem(itemId: string): { ok: true } | { ok: false; message: string } {
  const db = load();
  if (!db.items.some((i) => i.id === itemId)) {
    return { ok: false, message: "Вещь не найдена" };
  }
  db.items = db.items.filter((i) => i.id !== itemId);
  save(db);
  return { ok: true };
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
