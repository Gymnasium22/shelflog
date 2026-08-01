import { redirect } from "next/navigation";

import { SignupForm } from "@/features/auth/ui/signup-form";
import { createClient } from "@/shared/api/supabase/server";

export const metadata = {
  title: "Регистрация",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
