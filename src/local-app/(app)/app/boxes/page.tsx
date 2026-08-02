"use client";

import { useEffect, useState } from "react";
import { Box as BoxIcon } from "lucide-react";

import type { Box } from "@/entities/box/model/types";
import type { StorageLocation } from "@/entities/location/model/types";
import { EmptyState } from "@/local-app/ui/empty-state";
import { PageHeader } from "@/local-app/ui/page-header";
import {
  createBox,
  getHousehold,
  listBoxes,
  listLocations,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";

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
      <PageHeader
        title="Коробки"
        description="Код, название и место — удобно для QR и переездов."
      />

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="box-code">Код</Label>
            <Input
              id="box-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="A-01"
              className="mt-1.5 font-mono uppercase"
            />
          </div>
          <div>
            <Label htmlFor="box-name">Название (необязательно)</Label>
            <Input
              id="box-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Зима, документы…"
              className="mt-1.5"
            />
          </div>
        </div>
        {locations.length > 0 ? (
          <div>
            <Label htmlFor="box-loc">Место</Label>
            <Select
              id="box-loc"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.path}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <Button type="submit">Создать коробку</Button>
      </form>

      {boxes.length === 0 ? (
        <EmptyState
          icon={<BoxIcon className="h-5 w-5" />}
          title="Коробок пока нет"
          description="Задайте код вроде A-01 — его удобно печатать на этикетке."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {boxes.map((box, i) => (
            <li
              key={box.id}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 font-mono text-xs font-semibold text-accent">
                {box.code.slice(0, 4)}
              </span>
              <div className="min-w-0">
                <p className="font-medium">
                  <span className="font-mono text-accent">{box.code}</span>
                  {box.name ? (
                    <span className="text-muted"> — {box.name}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  {box.location_id
                    ? (locMap.get(box.location_id) ?? "Место")
                    : "Место не указано"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
