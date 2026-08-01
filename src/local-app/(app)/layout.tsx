"use client";

import Link from "next/link";

import { LocalAppNav } from "@/local-app/ui/local-app-nav";

export default function LocalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-9 items-center justify-between gap-3">
            <Link href="/app" className="shrink-0 text-sm font-semibold tracking-tight">
              ShelfLog
            </Link>
            <span className="rounded-lg bg-border/50 px-2 py-1 text-xs text-muted">
              локально
            </span>
          </div>
          <LocalAppNav />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
