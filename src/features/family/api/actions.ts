"use client";

import { z } from "zod";

import {
  INVITE_ROLES,
  type InviteRole,
} from "@/entities/household/model/roles";
import type { MemberRole } from "@/entities/household/model/types";
import { createClient } from "@/shared/api/supabase/client";
import { getAppOrigin } from "@/shared/lib/app-url";
import { getActiveHouseholdContextClient } from "@/shared/lib/household-client";
import type { ActionState as BaseActionState } from "@/shared/types/action-state";

export type ActionState = BaseActionState & {
  inviteUrl?: string | null;
};

export async function createInviteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const roleRaw = String(formData.get("role") ?? "editor");
  const emailRaw = String(formData.get("email") ?? "").trim();

  const roleParsed = z.enum(INVITE_ROLES).safeParse(roleRaw);
  if (!roleParsed.success) {
    return { ok: false, message: "Некорректная роль" };
  }

  const email =
    emailRaw === ""
      ? null
      : z.string().email("Некорректный email").safeParse(emailRaw);

  if (emailRaw && email && !email.success) {
    return { ok: false, message: email.error.issues[0]?.message ?? "Email" };
  }

  const ctx = await getActiveHouseholdContextClient();
  if (!ctx) return { ok: false, message: "Сначала создайте дом" };
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { ok: false, message: "Недостаточно прав" };
  }
  if (roleParsed.data === "admin" && ctx.role !== "owner") {
    return { ok: false, message: "Только владелец может пригласить админа" };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_invitation", {
    p_household_id: ctx.household.id,
    p_role: roleParsed.data as InviteRole,
    p_email: emailRaw || null,
    p_expires_days: 14,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const token = (row as { token?: string } | null)?.token;
  if (!token) {
    return { ok: false, message: "Инвайт создан, но токен не получен" };
  }

  const inviteUrl = `${getAppOrigin()}/invite/${token}`;

  return {
    ok: true,
    message: "Ссылка-приглашение создана (14 дней)",
    inviteUrl,
  };
}

export async function revokeInviteAction(
  invitationId: string,
): Promise<ActionState> {
  const ctx = await getActiveHouseholdContextClient();
  if (!ctx || (ctx.role !== "owner" && ctx.role !== "admin")) {
    return { ok: false, message: "Недостаточно прав" };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("revoke_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Приглашение отозвано" };
}

export async function updateMemberRoleAction(
  memberId: string,
  role: MemberRole,
): Promise<ActionState> {
  const ctx = await getActiveHouseholdContextClient();
  if (!ctx || (ctx.role !== "owner" && ctx.role !== "admin")) {
    return { ok: false, message: "Недостаточно прав" };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("update_member_role", {
    p_member_id: memberId,
    p_role: role,
  });

  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Роль обновлена" };
}

export async function removeMemberAction(memberId: string): Promise<ActionState> {
  const ctx = await getActiveHouseholdContextClient();
  if (!ctx) return { ok: false, message: "Нет дома" };

  const supabase = createClient();
  const { error } = await supabase.rpc("remove_member", {
    p_member_id: memberId,
  });

  if (error) return { ok: false, message: error.message };

  if (ctx.membership.id === memberId) {
    return { ok: true, message: "Вы вышли из дома", redirectTo: "/app" };
  }

  return { ok: true, message: "Участник удалён" };
}

export async function acceptInviteAction(token: string): Promise<ActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "auth_required" };
  }

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });

  if (error) {
    return { ok: false, message: mapInviteError(error.message) };
  }

  void data;
  return { ok: true, message: null, redirectTo: "/app" };
}

function mapInviteError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("expired")) return "Срок приглашения истёк";
  if (m.includes("not active") || m.includes("not found"))
    return "Приглашение недействительно";
  if (m.includes("email"))
    return "Войдите аккаунтом с email, на который выдали приглашение";
  return message;
}
