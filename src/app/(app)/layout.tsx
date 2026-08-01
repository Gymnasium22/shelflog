import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { SearchBar } from "@/features/search/ui/search-bar";
import { createClient } from "@/shared/api/supabase/server";
import { AppNav } from "@/widgets/app-shell/ui/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as {
    display_name: string | null;
    email: string | null;
  } | null;

  const displayName =
    profile?.display_name || user.email || "Пользователь";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-9 items-center justify-between gap-3">
            <Link href="/app" className="shrink-0 text-sm font-semibold tracking-tight">
              ShelfLog
            </Link>
            <SearchBar className="mx-2 hidden min-w-0 flex-1 sm:block sm:max-w-xs md:max-w-sm" />
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden max-w-[10rem] truncate text-sm text-muted lg:inline">
                {displayName}
              </span>
              <SignOutButton />
            </div>
          </div>
          <AppNav />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
