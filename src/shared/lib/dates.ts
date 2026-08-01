/** Local calendar date YYYY-MM-DD */
export function toDateOnly(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateOnly: string, days: number): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateOnly(dt);
}

export function formatDateRu(dateOnly: string | null | undefined): string {
  if (!dateOnly) return "—";
  const [y, m, d] = dateOnly.split("-").map(Number);
  if (!y || !m || !d) return dateOnly;
  return new Intl.DateTimeFormat("ru-BY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function formatDateTimeRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-BY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export function formatMoneyBy(n: number, currency = "BYN"): string {
  return `${new Intl.NumberFormat("ru-BY", {
    maximumFractionDigits: 2,
  }).format(n)} ${currency}`;
}

export function todayGreetingRu(date = new Date()): string {
  return new Intl.DateTimeFormat("ru-BY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
