"use client";

import { useEffect, useState } from "react";

import { ITEM_STATUS_LABELS, type Item } from "@/entities/item/model/types";
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
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Вещи</h1>
        <p className="text-sm text-muted">Список вещей дома.</p>
      </div>

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
          />
        </div>
        <Button type="submit">Добавить</Button>
      </form>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">Вещей пока нет.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted">{ITEM_STATUS_LABELS[item.status]}</p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
