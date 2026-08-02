"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";

import type { Box } from "@/entities/box/model/types";
import {
  ITEM_STATUS_LABELS,
  ITEM_STATUSES,
  type Item,
  type ItemStatus,
} from "@/entities/item/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { DeleteButton } from "@/local-app/ui/delete-button";
import { EmptyState } from "@/local-app/ui/empty-state";
import { NeedHousehold } from "@/local-app/ui/need-household";
import { PageHeader } from "@/local-app/ui/page-header";
import { Surface } from "@/local-app/ui/surface";
import {
  createItem,
  deleteItem,
  getHousehold,
  listBoxes,
  listItems,
  listLocations,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";

export default function LocalItemsPage() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ItemStatus>("in_use");
  const [locationId, setLocationId] = useState("");
  const [boxId, setBoxId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    const h = getHousehold();
    if (!h) {
      setHasHousehold(false);
      setItems([]);
      setLocations([]);
      setBoxes([]);
      return;
    }
    setHasHousehold(true);
    setItems(listItems(h.id));
    setLocations(listLocations(h.id));
    setBoxes(listBoxes(h.id));
  }

  useEffect(() => {
    refresh();
    setReady(true);
  }, [pathname]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const h = getHousehold();
    if (!h) return;
    try {
      createItem({
        householdId: h.id,
        name,
        status,
        locationId: locationId || null,
        boxId: boxId || null,
      });
      setName("");
      setStatus("in_use");
      setLocationId("");
      setBoxId("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  function handleDelete(id: string) {
    const result = deleteItem(id);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    refresh();
  }

  const locMap = new Map(locations.map((l) => [l.id, l.path]));
  const boxMap = new Map(boxes.map((b) => [b.id, b.code]));

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-3xl bg-card/60" />;
  }

  if (!hasHousehold) return <NeedHousehold />;

  return (
    <main className="space-y-7">
      <PageHeader
        title="Вещи"
        description="Инвентарь дома — место, коробка и статус."
      />

      <Surface className="animate-fade-up animate-fade-up-delay-1 space-y-4">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="item-name">Название</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ноутбук, дрель…"
              className="mt-1.5"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="item-status">Статус</Label>
              <Select
                id="item-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
              >
                {ITEM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ITEM_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="item-loc">Место</Label>
              <Select
                id="item-loc"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">Не указано</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.path}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="item-box">Коробка</Label>
              <Select
                id="item-box"
                value={boxId}
                onChange={(e) => {
                  const next = e.target.value;
                  setBoxId(next);
                  if (next && status === "in_use") setStatus("in_box");
                }}
              >
                <option value="">Не указано</option>
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                    {b.name ? ` — ${b.name}` : ""}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Добавить</Button>
        </form>
      </Surface>

      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="Вещей пока нет"
          description="Добавьте первую вещь — список сохранится в браузере."
        />
      ) : (
        <ul className="surface animate-fade-up animate-fade-up-delay-2 overflow-hidden rounded-3xl">
          {items.map((item, i) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.02] ${i > 0 ? "border-t border-border" : ""}`}
            >
              <span className="icon-chip flex h-10 w-10 shrink-0 items-center justify-center">
                <Package className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium tracking-tight">{item.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-muted">
                    {ITEM_STATUS_LABELS[item.status]}
                  </span>
                  {item.box_id ? (
                    <span className="rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent">
                      {boxMap.get(item.box_id) ?? "—"}
                    </span>
                  ) : null}
                  {item.location_id ? (
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-muted">
                      {locMap.get(item.location_id) ?? "место"}
                    </span>
                  ) : null}
                </div>
              </div>
              <DeleteButton
                confirmMessage={`Удалить «${item.name}»?`}
                onDelete={() => handleDelete(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
