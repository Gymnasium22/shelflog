"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Box, MapPin, Package, Plus, Sparkles } from "lucide-react";

import type { Household } from "@/entities/household/model/types";
import { Surface } from "@/local-app/ui/surface";
import {
  createHousehold,
  getCounts,
  getHousehold,
} from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function LocalDashboardPage() {
  const pathname = usePathname();
  const [household, setHousehold] = useState<Household | null | undefined>(
    undefined,
  );
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ locations: 0, boxes: 0, items: 0 });

  useEffect(() => {
    const h = getHousehold();
    setHousehold(h);
    if (h) setCounts(getCounts(h.id));
  }, [pathname]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const h = createHousehold(name);
      setHousehold(h);
      setCounts(getCounts(h.id));
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать дом");
    }
  }

  if (household === undefined) {
    return (
      <main className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-2xl bg-card/60" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-32 animate-pulse rounded-3xl bg-card/60" />
          <div className="h-32 animate-pulse rounded-3xl bg-card/60" />
          <div className="h-32 animate-pulse rounded-3xl bg-card/60" />
        </div>
      </main>
    );
  }

  if (!household) {
    return (
      <main className="mx-auto max-w-md animate-fade-up space-y-6">
        <div className="space-y-3 text-center sm:text-left">
          <div className="badge-soft mx-auto w-fit sm:mx-0">
            <Sparkles className="h-3 w-3 text-accent" />
            Первый запуск
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Создайте свой{" "}
            <span className="text-gradient">дом</span>
          </h1>
          <p className="text-[15px] leading-relaxed text-muted text-pretty">
            Данные сохраняются только в этом браузере — без регистрации.
          </p>
        </div>
        <Surface elevated className="space-y-4">
          <form onSubmit={handleCreate} className="space-y-4">
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
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full">
              Создать дом
            </Button>
          </form>
        </Surface>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <header className="animate-fade-up space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          Локальный режим
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
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
          delay="animate-fade-up-delay-1"
        />
        <StatCard
          href="/app/boxes"
          label="Коробки"
          value={counts.boxes}
          icon={<Box className="h-4 w-4" />}
          delay="animate-fade-up-delay-2"
        />
        <StatCard
          href="/app/items"
          label="Вещи"
          value={counts.items}
          icon={<Package className="h-4 w-4" />}
          delay="animate-fade-up-delay-3"
        />
      </div>

      <section className="animate-fade-up animate-fade-up-delay-3 space-y-3">
        <h2 className="text-[13px] font-medium tracking-wide text-muted">
          Быстрые действия
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
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
  delay,
}: {
  href: string;
  label: string;
  value: number;
  icon: ReactNode;
  delay?: string;
}) {
  return (
    <Link
      href={href}
      className={`surface group animate-fade-up rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/30 ${delay ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="icon-chip flex h-10 w-10 items-center justify-center transition group-hover:scale-105">
          {icon}
        </span>
        <ArrowRight className="h-4 w-4 text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-muted">{label}</p>
    </Link>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="surface inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition duration-200 hover:border-accent/35 hover:text-accent"
    >
      <Plus className="h-4 w-4" />
      {label}
    </Link>
  );
}
