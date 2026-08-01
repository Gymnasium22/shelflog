import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function readPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
  });
}

export function getPublicEnvStatus() {
  const env = readPublicEnv();
  const hasSupabaseUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseAnonKey = Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    hasSupabaseUrl,
    hasSupabaseAnonKey,
    ready: hasSupabaseUrl && hasSupabaseAnonKey,
    appUrl: env.NEXT_PUBLIC_APP_URL || null,
  };
}

/** Throws if public Supabase env is incomplete — use only in connected paths. */
export function requireSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.",
    );
  }

  return { url, anonKey };
}
