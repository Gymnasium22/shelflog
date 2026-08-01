import Link from "next/link";

import {
  ITEM_STATUS_LABELS,
  type ItemStatus,
} from "@/entities/item/model/types";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/entities/document/model/types";
import { formatDateRu } from "@/shared/lib/dates";
import type { DashboardData } from "@/widgets/dashboard/model/types";
import { ListLink, SectionCard } from "@/widgets/dashboard/ui/section-card";
import { StatGrid } from "@/widgets/dashboard/ui/stat-grid";

export function DashboardView({ data }: { data: DashboardData }) {
  const {
    today,
    counts,
    currency,
    householdName,
    warrantiesExpiring,
    warrantiesExpired,
    inRepair,
    recentItems,
    recentDocuments,
    activity,
  } = data;

  const attentionCount =
    today.warrantiesEndingToday.length +
    warrantiesExpiring.length +
    counts.inRepair;

  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-wide text-muted capitalize">
            Сегодня · {today.label}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {householdName}
          </h1>
          <p className="text-sm text-muted">
            Dashboard · валюта {currency}
            {attentionCount > 0
              ? ` · ${attentionCount} требует внимания`
              : " · всё спокойно"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <TodayChip
            label="Гарантии заканчиваются сегодня"
            value={String(today.warrantiesEndingToday.length)}
            tone={
              today.warrantiesEndingToday.length > 0 ? "warn" : "neutral"
            }
          />
          <TodayChip
            label="Вещей добавлено сегодня"
            value={String(today.itemsAddedToday.length)}
          />
          <TodayChip
            label="Документов сегодня"
            value={String(today.docsAddedToday)}
          />
        </div>
      </header>

      <StatGrid counts={counts} currency={currency} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <QuickLink href="/app/items/new" title="Добавить вещь" />
        <QuickLink href="/app/boxes/new" title="Добавить коробку" />
        <QuickLink href="/app/documents/new" title="Загрузить документ" />
        <QuickLink href="/app/scan" title="Сканировать QR" />
        <QuickLink href="/app/search" title="Поиск" />
        <QuickLink href="/app/family" title="Семья" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Заканчиваются гарантии (30 дней)"
          href="/app/items"
          empty={
            warrantiesExpiring.length === 0
              ? {
                  text: "Нет гарантий, которые заканчиваются в ближайший месяц.",
                }
              : undefined
          }
        >
          {warrantiesExpiring.map((item) => (
            <ListLink
              key={item.id}
              href={`/app/items/${item.id}`}
              title={item.name}
              meta={[item.brand, formatDateRu(item.warranty_until)]
                .filter(Boolean)
                .join(" · ")}
              accent={formatDateRu(item.warranty_until)}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="На ремонте / внимание"
          href="/app/items?status=in_repair"
          empty={
            inRepair.length === 0 && warrantiesExpired.length === 0
              ? {
                  text: "Нет вещей на ремонте. Просроченные гарантии тоже появятся здесь.",
                }
              : undefined
          }
        >
          {inRepair.map((item) => (
            <ListLink
              key={item.id}
              href={`/app/items/${item.id}`}
              title={item.name}
              meta={
                ITEM_STATUS_LABELS[item.status as ItemStatus] ?? item.status
              }
              accent="Ремонт"
            />
          ))}
          {warrantiesExpired.slice(0, 4).map((item) => (
            <ListLink
              key={`exp-${item.id}`}
              href={`/app/items/${item.id}`}
              title={item.name}
              meta={`Гарантия истекла · ${formatDateRu(item.warranty_until)}`}
              accent="Истекла"
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Последние вещи"
          href="/app/items"
          hrefLabel="Все"
          empty={
            recentItems.length === 0
              ? {
                  text: "Пока нет вещей.",
                  href: "/app/items/new",
                  cta: "Добавить вещь",
                }
              : undefined
          }
        >
          {recentItems.map((item) => (
            <ListLink
              key={item.id}
              href={`/app/items/${item.id}`}
              title={item.name}
              meta={
                ITEM_STATUS_LABELS[item.status as ItemStatus] ?? item.status
              }
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Последние документы"
          href="/app/documents"
          empty={
            recentDocuments.length === 0
              ? {
                  text: "Документов пока нет.",
                  href: "/app/documents/new",
                  cta: "Загрузить",
                }
              : undefined
          }
        >
          {recentDocuments.map((doc) => (
            <ListLink
              key={doc.id}
              href={`/app/documents/${doc.id}`}
              title={doc.title}
              meta={
                DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ?? doc.type
              }
            />
          ))}
        </SectionCard>
      </div>

      <SectionCard
        title="Последние изменения"
        empty={
          activity.length === 0
            ? {
                text: "Лента появится, когда вы добавите вещи, коробки или документы.",
              }
            : undefined
        }
      >
        {activity.map((row) => (
          <ListLink
            key={row.id}
            href={row.href}
            title={row.title}
            meta={row.subtitle}
          />
        ))}
      </SectionCard>

      <section className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted">
        <p className="font-medium text-foreground">Предстоящие обслуживания</p>
        <p className="mt-1">
          Напоминания (фильтр, батареи, ТО) появятся отдельным этапом. Пока
          смотрите гарантии и статус «На ремонте».
        </p>
        <Link
          href="/app/search?itemStatus=in_repair"
          className="mt-2 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Найти вещи на ремонте
        </Link>
      </section>
    </main>
  );
}

function TodayChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        tone === "warn"
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-border bg-card"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-dashed border-border px-4 py-4 text-center text-sm font-medium transition hover:border-ring hover:bg-card"
    >
      {title}
    </Link>
  );
}
