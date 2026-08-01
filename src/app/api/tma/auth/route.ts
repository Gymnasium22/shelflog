import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/shared/api/supabase/admin";
import { requireSupabasePublicEnv } from "@/shared/config/env";
import {
  displayNameFromTelegram,
  telegramSyntheticEmail,
  validateTelegramInitData,
} from "@/shared/lib/telegram/validate-init-data";

export const runtime = "nodejs";

function isAlreadyRegistered(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already") ||
    m.includes("registered") ||
    m.includes("exists") ||
    m.includes("duplicate")
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { initData?: string };
    const initData = body.initData ?? "";

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "TELEGRAM_BOT_TOKEN не задан. Добавьте токен бота в env сервера.",
        },
        { status: 503 },
      );
    }

    const validated = validateTelegramInitData(initData, botToken);
    const email = telegramSyntheticEmail(validated.user.id);
    const displayName = displayNameFromTelegram(validated.user);

    const admin = createAdminClient();

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          telegram_id: validated.user.id,
          display_name: displayName,
          username: validated.user.username ?? null,
          locale: validated.user.language_code ?? "ru",
        },
      });

    if (createError && !isAlreadyRegistered(createError.message)) {
      return NextResponse.json(
        { ok: false, message: createError.message },
        { status: 400 },
      );
    }

    let userId = created?.user?.id ?? null;

    if (!userId) {
      const { data: byTg } = await admin
        .from("profiles")
        .select("id")
        .eq("telegram_id", validated.user.id)
        .maybeSingle();
      userId = (byTg as { id: string } | null)?.id ?? null;
    }

    if (!userId) {
      // Last resort: generateLink still needs existing user; try link then read user
      const { data: linkProbe } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      userId = linkProbe?.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "Пользователь Telegram не найден в Auth" },
        { status: 500 },
      );
    }

    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        display_name: displayName,
        telegram_id: validated.user.id,
        locale: validated.user.language_code ?? "ru",
      },
      { onConflict: "id" },
    );

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json(
        {
          ok: false,
          message: linkError?.message ?? "Не удалось выдать сессию",
        },
        { status: 500 },
      );
    }

    const { url: supabaseUrl, anonKey } = requireSupabasePublicEnv();
    const cookieStore = await cookies();

    type CookieToSet = {
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
    };

    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const { data: sessionData, error: otpError } =
      await supabase.auth.verifyOtp({
        type: "email",
        token_hash: linkData.properties.hashed_token,
      });

    if (otpError || !sessionData.session) {
      return NextResponse.json(
        {
          ok: false,
          message: otpError?.message ?? "Не удалось создать сессию",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email,
        displayName,
        telegramId: validated.user.id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка Telegram auth";
    return NextResponse.json({ ok: false, message }, { status: 401 });
  }
}
