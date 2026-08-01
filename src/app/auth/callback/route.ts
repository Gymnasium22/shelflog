import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/shared/api/supabase/server";

/**
 * Handles magic-link / email-confirm redirects from Supabase Auth.
 * URL shape: /auth/callback?code=...&next=/app
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }
  return next;
}
