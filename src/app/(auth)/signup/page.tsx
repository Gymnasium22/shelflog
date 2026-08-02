import { redirect } from "next/navigation";

import { RedirectIfAuthed } from "@/features/auth/ui/redirect-if-authed";
import { SignupForm } from "@/features/auth/ui/signup-form";

export const dynamic = "force-dynamic";

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

export const metadata = {
  title: "Регистрация",
};

export default async function SignupPage() {
  if (!isGitHubPages) {
    const { createClient } = await import("@/shared/api/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/app");
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {isGitHubPages ? <RedirectIfAuthed /> : null}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Регистрация</h1>
        <p className="text-sm text-muted">
          Создайте аккаунт, чтобы вести паспорт дома.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
