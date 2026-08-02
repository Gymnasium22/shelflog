"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";

import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPES,
  type LocationType,
  type StorageLocation,
} from "@/entities/location/model/types";
import { DeleteButton } from "@/local-app/ui/delete-button";
import { EmptyState } from "@/local-app/ui/empty-state";
import { NeedHousehold } from "@/local-app/ui/need-household";
import { PageHeader } from "@/local-app/ui/page-header";
import {
  createLocation,
  deleteLocation,
  getHousehold,
  listLocations,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";

export default function LocalLocationsPage() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("room");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    const h = getHousehold();
    if (!h) {
      setHasHousehold(false);
      setLocations([]);
      return;
    }
    setHasHousehold(true);
    const locs = listLocations(h.id);
    setLocations(locs);
    if (locs[0] && !locs.some((l) => l.id === parentId)) {
      setParentId(locs[0].id);
    } else if (locs[0] && !parentId) {
      setParentId(locs[0].id);
    }
  }

  useEffect(() => {
    refresh();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on nav
  }, [pathname]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const h = getHousehold();
    if (!h) return;
    try {
      createLocation({
        householdId: h.id,
        parentId: parentId || null,
        name,
        type,
      });
      setName("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  function handleDelete(id: string) {
    const result = deleteLocation(id);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    refresh();
  }

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-2xl bg-card" />;
  }

  if (!hasHousehold) return <NeedHousehold />;

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
            {LOCATION_TYPES.filter((t) => t !== "home").map((t) => (
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
              required
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.path}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit">Добавить место</Button>
      </form>

      {locations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-5 w-5" />}
          title="Мест пока нет"
          description="Добавьте комнату или зону внутри дома."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {locations.map((loc, i) => (
            <li
              key={loc.id}
              className={`flex items-center gap-2 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
              style={{ paddingLeft: `${16 + loc.depth * 16}px` }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{loc.name}</p>
                <p className="text-xs text-muted">
                  {LOCATION_TYPE_LABELS[loc.type]} · {loc.path}
                </p>
              </div>
              {loc.parent_id !== null ? (
                <DeleteButton
                  confirmMessage={`Удалить «${loc.name}» и все вложенные места? Коробки и вещи в них останутся, но без привязки к месту.`}
                  onDelete={() => handleDelete(loc.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
