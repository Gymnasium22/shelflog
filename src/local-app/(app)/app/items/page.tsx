"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { ITEM_STATUS_LABELS, type Item } from "@/entities/item/model/types";
import { EmptyState } from "@/local-app/ui/empty-state";
import { PageHeader } from "@/local-app/ui/page-header";
import { createItem, getHousehold, listItems } from "@/shared/lib/local-db";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function LocalItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const h = getHousehold();
    if (h) setItems(listItems(h.id));
  }, []);

  function refresh() {
    const h = getHousehold();
    if (h) setItems(listItems(h.id));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const h = getHousehold();
    if (!h || !name.trim()) return;
    createItem({ householdId: h.id, name });
    setName("");
    refresh();
  }

  return (
    <main className="space-y-8">
      <PageHeader
        title="Вещи"
        description="Инвентарь дома — названия и статусы."
      />

      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-6"
      >
        <div className="min-w-[200px] flex-1">
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
        <Button type="submit">Добавить</Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="Вещей пока нет"
          description="Добавьте первую вещь — список сохранится в браузере."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((item, i) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Package className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted">
                  {ITEM_STATUS_LABELS[item.status]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
