import type { MemberRole } from "@/entities/household/model/types";

export const MEMBER_ROLES = ["owner", "admin", "editor", "viewer"] as const;

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Владелец",
  admin: "Админ",
  editor: "Редактор",
  viewer: "Наблюдатель",
};

export const INVITE_ROLES = ["admin", "editor", "viewer"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const INVITE_ROLE_LABELS: Record<InviteRole, string> = {
  admin: "Админ",
  editor: "Редактор",
  viewer: "Наблюдатель",
};

export const MEMBER_ROLE_HINTS: Record<MemberRole, string> = {
  owner: "Полный доступ, передача владения, удаление дома",
  admin: "Участники и инвайты (кроме владельца), весь контент",
  editor: "Создание и правка вещей, мест, коробок, документов",
  viewer: "Только просмотр",
};

export function canManageMembers(role: MemberRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canEditContent(role: MemberRole | null | undefined): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}
