"use client";

import { useEffect, useState } from "react";

import type { Box } from "@/entities/box/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { createBox, getHousehold, listBoxes, listLocations } from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function LocalBoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    const h = getHousehold();
    if (!h) return;
    setBoxes(listBoxes(h.id));
    const locs = listLocations(h.id);
    setLocations(locs);
    if (locs[0]) setLocationId(locs[0].id);
  }, []);

  function refresh() {
    const h = getHousehold();
    if (h) setBoxes(listBoxes(h.id));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const h = getHousehold();
    if (!h || !code.trim()) return;
    createBox({
      householdId: h.id,
      code,
      name: name || undefined,
      locationId: locationId || null,
    });
    setCode("");
    setName("");
    refresh();
  }

  const locMap = new Map(locations.map((l) => [l.id, l.name]));

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Коробки</h1>
        <p className="text-sm text-muted">Код, название и место хранения.</p>
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <div>
          <Label htmlFor="box-code">Код</Label>
          <Input
            id="box-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="A-01"
          />
        </div>
        <div>
          <Label htmlFor="box-name">Название (необязательно)</Label>
          <Input
            id="box-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Зима, документы…"
          />
        </div>
        {locations.length > 0 ? (
          <div>
            <Label htmlFor="box-loc">Место</Label>
            <select
              id="box-loc"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
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
        <Button type="submit">Создать коробку</Button>
      </form>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {boxes.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">Коробок пока нет.</li>
        ) : (
          boxes.map((box) => (
            <li key={box.id} className="px-4 py-3">
              <p className="font-medium">
                {box.code}
                {box.name ? <span className="text-muted"> — {box.name}</span> : null}
              </p>
              <p className="text-xs text-muted">
                {box.location_id ? locMap.get(box.location_id) ?? "Место" : "Место не указано"}
              </p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
