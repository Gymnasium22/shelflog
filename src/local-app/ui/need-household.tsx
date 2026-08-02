import Link from "next/link";
import { House } from "lucide-react";

import { EmptyState } from "@/local-app/ui/empty-state";

export function NeedHousehold() {
  return (
    <div className="animate-fade-up mx-auto max-w-md space-y-5">
      <EmptyState
        icon={<House className="h-5 w-5" />}
        title="Сначала создайте дом"
        description="На главной укажите название — после этого появятся места, коробки и вещи."
      />
      <div className="flex justify-center">
        <Link
          href="/app"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-400 px-5 text-sm font-semibold text-accent-foreground shadow-[0_10px_28px_-12px_var(--surface-glow)] transition hover:brightness-110"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
