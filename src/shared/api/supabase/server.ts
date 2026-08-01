import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicEnv } from "@/shared/config/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<
    Awaited<ReturnType<typeof cookies>>["set"]
  >[2];
};

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — middleware will refresh session.
        }
      },
    },
  });
}
