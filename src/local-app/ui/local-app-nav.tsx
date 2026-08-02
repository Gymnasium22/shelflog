"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";

const links = [
  { href: "/app", label: "Главная", exact: true, icon: LayoutDashboard },
  { href: "/app/locations", label: "Места", icon: MapPin },
  { href: "/app/boxes", label: "Коробки", icon: Box },
  { href: "/app/items", label: "Вещи", icon: Package },
  { href: "/app/settings", label: "Ещё", icon: Settings },
];

export function LocalAppNav() {
  const pathname = usePathname();

  return (
    <nav className="surface flex gap-1 overflow-x-auto rounded-2xl p-1.5">
      {links.map((link) => {
        const path =
          pathname.endsWith("/") && pathname.length > 1
            ? pathname.slice(0, -1)
            : pathname;
        const active = link.exact
          ? path === link.href
          : path === link.href || path.startsWith(`${link.href}/`);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex min-w-fit flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition duration-200 sm:flex-none",
              active
                ? "bg-gradient-to-br from-accent to-cyan-400 text-accent-foreground shadow-[0_6px_20px_-8px_var(--surface-glow)]"
                : "text-muted hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 opacity-90" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
