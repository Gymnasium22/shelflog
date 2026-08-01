"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTma } from "@/features/tma/ui/tma-provider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

const nav = [
  { href: "/tma", label: "Главная", exact: true },
  { href: "/tma/search", label: "Поиск" },
  { href: "/tma/items/new", label: "Добавить" },
  { href: "/tma/scan", label: "QR" },
];

export function TmaShell({ children }: { children: React.ReactNode }) {
  const { status, error, user, retry } = useTma();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-muted">Вход через Telegram…</p>
      </div>
    );
  }

  if (status === "error" || status === "no-telegram") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="text-xl font-semibold">ShelfLog Mini App</h1>
        <p className="text-sm text-muted">{error}</p>
        <Button type="button" onClick={retry}>
          Повторить
        </Button>
        <Link href="/login" className="text-sm text-muted underline-offset-4 hover:underline">
          Обычный вход в веб
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">ShelfLog</p>
            <p className="truncate text-xs text-muted">
              {user?.displayName ?? "Telegram"}
            </p>
          </div>
          <Link href="/app" className="text-xs text-muted underline-offset-4 hover:underline">
            Полная версия
          </Link>
        </div>
        <nav className="mt-3 flex gap-1 overflow-x-auto">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:bg-border/40",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="flex-1 px-4 py-4 pb-8">{children}</div>
    </div>
  );
}
