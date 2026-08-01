"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Household } from "@/entities/household/model/types";
import {
  createHousehold,
  getCounts,
  getHousehold,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function LocalDashboardPage() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [name, setName] = useState("");
  const [counts, setCounts] = useState({ locations: 0, boxes: 0, items: 0 });

  useEffect(() => {
    const h = getHousehold();
    setHousehold(h);
    if (h) setCounts(getCounts(h.id));
  }, []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const h = createHousehold(name);
    setHousehold(h);
    setCounts(getCounts(h.id));
    setName("");
  }

  if (!household) {
    return (
      <main className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Создайте свой дом</h1>
          <p className="text-muted">
            Данные сохраняются в браузере на этом устройстве.
          </p>
        </div>
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <Label htmlFor="name">Название дома</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Например: Наша квартира"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full">
            Создать дом
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Локальный режим
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{household.name}</h1>
        <p className="text-sm text-muted">Валюта: {household.currency}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard href="/app/locations" label="Места" value={counts.locations} />
        <StatCard href="/app/boxes" label="Коробки" value={counts.boxes} />
        <StatCard href="/app/items" label="Вещи" value={counts.items} />
      </div>
    </main>
  );
}

function StatCard({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-card p-5 transition hover:bg-border/20"
    >
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </Link>
  );
}
