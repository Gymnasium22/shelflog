"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/shared/api/supabase/client";
import { safeNextPath } from "@/features/auth/api/auth-shared";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const next = safeNextPath(searchParams.get("next"));

    if (!code) {
      router.replace("/login?error=auth_callback");
      return;
    }

    const supabase = createClient();
    void supabase.auth.exchangeCodeForSession(code).then(({ error: authError }) => {
      if (authError) {
        setError("Не удалось завершить вход. Попробуйте снова.");
        return;
      }

      router.replace(next);
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Ошибка входа</h1>
        <p className="text-muted">{error}</p>
        <a href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
          Вернуться ко входу
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <p className="text-muted">Завершаем вход…</p>
    </main>
  );
}
