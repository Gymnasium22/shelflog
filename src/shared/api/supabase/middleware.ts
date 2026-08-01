import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/health",
  "/auth/callback",
]);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next");

  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  // /tma loads shell without cookies first; client posts initData → session cookies
  const isTmaRoute = pathname === "/tma" || pathname.startsWith("/tma/");

  if (!user && isAppRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Optional: after TMA auth fails repeatedly, still allow shell (provider handles UI)
  void isTmaRoute;

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const next = request.nextUrl.searchParams.get("next");
    const redirectUrl = request.nextUrl.clone();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      redirectUrl.pathname = next;
      redirectUrl.search = "";
    } else {
      redirectUrl.pathname = "/app";
      redirectUrl.search = "";
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Keep public marketing page reachable; no force-redirect for "/"
  void isPublic;

  return supabaseResponse;
}
