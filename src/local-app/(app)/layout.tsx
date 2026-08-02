"use client";

import Link from "next/link";
import { Package } from "lucide-react";

import { LocalAppNav } from "@/local-app/ui/local-app-nav";

export default function LocalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-9 items-center justify-between gap-3">
            <Link
              href="/app"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Package className="h-3.5 w-3.5" />
              </span>
              ShelfLog
            </Link>
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted uppercase">
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
