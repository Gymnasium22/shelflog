import { createBrowserClient } from "@supabase/ssr";

import { requireSupabasePublicEnv } from "@/shared/config/env";

export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();

  // Untyped client until full generated Database types are wired (Stage 5+).
  return createBrowserClient(url, anonKey);
}
