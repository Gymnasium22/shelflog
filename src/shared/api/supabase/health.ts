import { getPublicEnvStatus } from "@/shared/config/env";

export type SupabaseHealthResult = {
  ok: boolean;
  message: string;
  latencyMs: number | null;
};

/**
 * Lightweight connectivity check without requiring a migrated schema.
 * Hits Supabase Auth settings endpoint with the anon key.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  const status = getPublicEnvStatus();

  if (!status.ready) {
    return {
      ok: false,
      message: "Переменные окружения не заданы",
      latencyMs: null,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const started = Date.now();

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - started;

    if (!response.ok) {
      return {
        ok: false,
        message: `HTTP ${response.status}`,
        latencyMs,
      };
    }

    return {
      ok: true,
      message: "OK",
      latencyMs,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Не удалось подключиться",
      latencyMs: Date.now() - started,
    };
  }
}
