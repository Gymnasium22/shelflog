import Link from "next/link";

import { formatMoneyBy } from "@/shared/lib/dates";
import type { DashboardCounts } from "@/widgets/dashboard/model/types";

export function StatGrid({
  counts,
  currency,
}: {
  counts: DashboardCounts;
  currency: string;
}) {
  const cards = [
    { label: "Вещи", value: String(counts.items), href: "/app/items" },
    { label: "Коробки", value: String(counts.boxes), href: "/app/boxes" },
    {
      label: "Документы",
      value: String(counts.documents),
      href: "/app/documents",
    },
    {
      label: "Места",
      value: String(counts.locations),
      href: "/app/locations",
    },
    {
      label: "Имущество",
      value: formatMoneyBy(counts.totalValue, currency),
      href: "/app/items",
    },
    {
      label: "На ремонте",
      value: String(counts.inRepair),
      href: "/app/items?status=in_repair",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-ring"
        >
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {c.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{c.value}</p>
        </Link>
      ))}
    </section>
  );
}
