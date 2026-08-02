"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPES,
  type LocationType,
  type StorageLocation,
} from "@/entities/location/model/types";
import { EmptyState } from "@/local-app/ui/empty-state";
import { PageHeader } from "@/local-app/ui/page-header";
import {
  createLocation,
  getHousehold,
  listLocations,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";

export default function LocalLocationsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("room");
  const [parentId, setParentId] = useState<string>("");
  const [hasHousehold, setHasHousehold] = useState(true);

  useEffect(() => {
    const h = getHousehold();
    if (!h) {
      setHasHousehold(false);
      return;
    }
    setHasHousehold(true);
    const locs = listLocations(h.id);
    setLocations(locs);
    if (locs[0]) setParentId(locs[0].id);
  }, []);

  function refresh() {
    const h = getHousehold();
    if (h) setLocations(listLocations(h.id));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const h = getHousehold();
    if (!h || !name.trim()) return;
    createLocation({
      householdId: h.id,
      parentId: parentId || null,
      name,
      type,
    });
    setName("");
    refresh();
  }

  if (!hasHousehold) {
    return (
      <EmptyState
        icon={<MapPin className="h-5 w-5" />}
        title="Сначала создайте дом"
        description="На главной укажите название — после этого можно строить дерево мест."
      />
    );
  }

  return (
    <main className="space-y-8">
      <PageHeader
        title="Места хранения"
        description="Комнаты, шкафы, полки — иерархия на этом устройстве."
      />

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <div>
          <Label htmlFor="loc-name">Название</Label>
          <Input
            id="loc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Кухня, шкаф…"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="loc-type">Тип</Label>
          <Select
            id="loc-type"
            value={type}
            onChange={(e) => setType(e.target.value as LocationType)}
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {LOCATION_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        {locations.length > 0 ? (
          <div>
            <Label htmlFor="loc-parent">Внутри</Label>
            <Select
              id="loc-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.path}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <Button type="submit">Добавить место</Button>
      </form>

      {locations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-5 w-5" />}
          title="Мест пока нет"
          description="Добавьте комнату или зону — она станет корнем дерева хранения."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {locations.map((loc, i) => (
            <li
              key={loc.id}
              className={`px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
              style={{ paddingLeft: `${16 + loc.depth * 16}px` }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-xs text-muted">
                    {LOCATION_TYPE_LABELS[loc.type]} · {loc.path}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
