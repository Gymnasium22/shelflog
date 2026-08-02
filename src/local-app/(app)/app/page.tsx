"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, MapPin, Package, Plus } from "lucide-react";

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
          <p className="text-xs font-medium tracking-wide text-accent uppercase">
            Первый запуск
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Создайте свой дом
          </h1>
          <p className="text-muted text-pretty">
            Данные сохраняются только в этом браузере — без регистрации.
          </p>
        </div>
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_0_40px_var(--surface-glow)]"
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
              className="mt-1.5"
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
        <p className="text-xs font-medium tracking-wide text-accent uppercase">
          Локальный режим
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {household.name}
        </h1>
        <p className="text-sm text-muted">
          Валюта {household.currency} · всё на этом устройстве
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          href="/app/locations"
          label="Места"
          value={counts.locations}
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          href="/app/boxes"
          label="Коробки"
          value={counts.boxes}
          icon={<Box className="h-4 w-4" />}
        />
        <StatCard
          href="/app/items"
          label="Вещи"
          value={counts.items}
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted">Быстрые действия</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <QuickLink href="/app/locations" label="Добавить место" />
          <QuickLink href="/app/boxes" label="Добавить коробку" />
          <QuickLink href="/app/items" label="Добавить вещь" />
        </div>
      </section>
    </main>
  );
}

function StatCard({
  href,
  label,
  value,
  icon,
}: {
  href: string;
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40 hover:bg-card-elevated"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/15">
          {icon}
        </span>
        <ArrowRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-sm text-muted">{label}</p>
    </Link>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium transition hover:border-accent/40 hover:text-accent"
    >
      <Plus className="h-4 w-4" />
      {label}
    </Link>
  );
}
