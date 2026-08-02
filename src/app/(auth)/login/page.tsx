import { redirect } from "next/navigation";

import { RedirectIfAuthed } from "@/features/auth/ui/redirect-if-authed";
import { LoginForm } from "@/features/auth/ui/login-form";

export const dynamic = "force-dynamic";

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

export const metadata = {
  title: "Вход",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/app";

  if (!isGitHubPages) {
    const { createClient } = await import("@/shared/api/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(next);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {isGitHubPages ? <RedirectIfAuthed next={next} /> : null}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
        <p className="text-sm text-muted">
          Пароль или magic link — как удобнее.
        </p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
