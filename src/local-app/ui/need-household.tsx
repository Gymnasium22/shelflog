import Link from "next/link";
import { House } from "lucide-react";

import { EmptyState } from "@/local-app/ui/empty-state";

export function NeedHousehold() {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={<House className="h-5 w-5" />}
        title="Сначала создайте дом"
        description="На главной укажите название — после этого появятся места, коробки и вещи."
      />
      <div className="flex justify-center">
        <Link
          href="/app"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground shadow-[0_0_20px_var(--surface-glow)] transition hover:opacity-90"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
