"use client";

import { useEffect, useState } from "react";

import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPES,
  type LocationType,
  type StorageLocation,
} from "@/entities/location/model/types";
import {
  createLocation,
  getHousehold,
  listLocations,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function LocalLocationsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("room");
  const [parentId, setParentId] = useState<string>("");

  useEffect(() => {
    const h = getHousehold();
    if (h) {
      const locs = listLocations(h.id);
      setLocations(locs);
      if (locs[0]) setParentId(locs[0].id);
    }
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

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Места хранения</h1>
        <p className="text-sm text-muted">Дерево мест — данные в localStorage.</p>
      </div>

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
          />
        </div>
        <div>
          <Label htmlFor="loc-type">Тип</Label>
          <select
            id="loc-type"
            value={type}
            onChange={(e) => setType(e.target.value as LocationType)}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {LOCATION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {locations.length > 0 ? (
          <div>
            <Label htmlFor="loc-parent">Внутри</Label>
            <select
              id="loc-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.path}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <Button type="submit">Добавить место</Button>
      </form>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {locations.map((loc) => (
          <li
            key={loc.id}
            className="px-4 py-3"
            style={{ paddingLeft: `${16 + loc.depth * 16}px` }}
          >
            <p className="font-medium">{loc.name}</p>
            <p className="text-xs text-muted">
              {LOCATION_TYPE_LABELS[loc.type]} · {loc.path}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
