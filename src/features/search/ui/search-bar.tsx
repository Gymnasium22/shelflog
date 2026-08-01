"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push("/app/search");
      return;
    }
    router.push(`/app/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={className}
      role="search"
    >
      <label className="relative block">
        <span className="sr-only">Поиск</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Поиск…"
          className="h-9 w-full min-w-[10rem] rounded-xl border border-border bg-card pr-3 pl-9 text-sm outline-none transition placeholder:text-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:min-w-[14rem]"
        />
      </label>
    </form>
  );
}
