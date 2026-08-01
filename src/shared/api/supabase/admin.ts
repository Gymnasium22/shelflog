import { createClient } from "@supabase/supabase-js";

import { requireSupabasePublicEnv } from "@/shared/config/env";

/** Service-role client — server only, never import from client components. */
export function createAdminClient() {
  const { url } = requireSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY не задан (нужен для Telegram auth)",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
