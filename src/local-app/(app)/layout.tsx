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
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-3.5 px-4 py-3.5 sm:px-6">
          <div className="flex h-10 items-center justify-between gap-3">
            <Link
              href="/app"
              className="group inline-flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight"
            >
              <span className="icon-chip flex h-9 w-9 items-center justify-center transition group-hover:scale-105">
                <Package className="h-4 w-4" />
              </span>
              <span>
                Shelf
                <span className="text-gradient">Log</span>
              </span>
            </Link>
            <span className="badge-soft">
              <span className="dot" />
              локально
            </span>
          </div>
          <LocalAppNav />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}
