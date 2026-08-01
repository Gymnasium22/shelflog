import type { QrEntityType } from "@/shared/lib/app-url";
import { createClient } from "@/shared/api/supabase/server";

export type ResolvedQr = {
  entity_type: QrEntityType;
  entity_id: string;
  household_id: string;
  title: string;
};

export async function resolveQrToken(
  token: string,
): Promise<{ data: ResolvedQr | null; error: string | null }> {
  const clean = token.trim();
  if (!clean) {
    return { data: null, error: "Пустой QR-код" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "auth_required" };
  }

  const { data, error } = await supabase.rpc("resolve_qr_token", {
    p_token: clean,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const rows = data as ResolvedQr[] | null;
  const row = rows?.[0] ?? null;

  if (!row) {
    return {
      data: null,
      error: "Код не найден или у вас нет доступа к этому дому",
    };
  }

  return { data: row, error: null };
}
