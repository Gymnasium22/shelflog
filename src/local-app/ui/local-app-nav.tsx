"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/cn";

const links = [
  { href: "/app", label: "Dashboard", exact: true },
  { href: "/app/locations", label: "Места" },
  { href: "/app/boxes", label: "Коробки" },
  { href: "/app/items", label: "Вещи" },
  { href: "/app/settings", label: "Ещё" },
];

export function LocalAppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-border/40 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
