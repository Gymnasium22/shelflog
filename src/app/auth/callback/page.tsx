import { Suspense } from "react";

import { AuthCallbackClient } from "@/features/auth/ui/auth-callback-client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
          <p className="text-muted">Завершаем вход…</p>
        </main>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
