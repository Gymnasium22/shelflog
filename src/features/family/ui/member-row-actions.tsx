"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  MEMBER_ROLE_LABELS,
  type InviteRole,
} from "@/entities/household/model/roles";
import type { MemberRole } from "@/entities/household/model/types";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/features/family/api/actions";
import { Button } from "@/shared/ui/button";

type Props = {
  memberId: string;
  currentRole: MemberRole;
  isSelf: boolean;
  myRole: MemberRole;
};

export function MemberRowActions({
  memberId,
  currentRole,
  isSelf,
  myRole,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const canChangeRole =
    !isSelf &&
    currentRole !== "owner" &&
    (myRole === "owner" || (myRole === "admin" && currentRole !== "admin"));

  const canRemove =
    (isSelf && currentRole !== "owner") ||
    (!isSelf &&
      currentRole !== "owner" &&
      (myRole === "owner" ||
        (myRole === "admin" && currentRole !== "admin")));

  const canTransfer =
    myRole === "owner" && !isSelf && currentRole !== "owner";

  const roleOptions: MemberRole[] =
    myRole === "owner"
      ? ["admin", "editor", "viewer"]
      : ["editor", "viewer"];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canChangeRole ? (
        <select
          className="h-9 rounded-lg border border-border bg-card px-2 text-xs"
          defaultValue={currentRole}
          disabled={pending}
          onChange={(e) => {
            const role = e.target.value as MemberRole;
            start(async () => {
              const res = await updateMemberRoleAction(memberId, role);
              if (!res.ok) alert(res.message);
              router.refresh();
            });
          }}
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {MEMBER_ROLE_LABELS[r as InviteRole & MemberRole] ?? r}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-muted">
          {MEMBER_ROLE_LABELS[currentRole]}
          {isSelf ? " (вы)" : ""}
        </span>
      )}

      {canTransfer ? (
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-2 text-xs"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                "Передать владение этому участнику? Вы станете админом.",
              )
            )
              return;
            start(async () => {
              const res = await updateMemberRoleAction(memberId, "owner");
              if (!res.ok) alert(res.message);
              router.refresh();
            });
          }}
        >
          Сделать владельцем
        </Button>
      ) : null}

      {canRemove ? (
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-2 text-xs"
          disabled={pending}
          onClick={() => {
            const msg = isSelf
              ? "Покинуть этот дом?"
              : "Удалить участника из дома?";
            if (!confirm(msg)) return;
            start(async () => {
              const res = await removeMemberAction(memberId);
              if (!res.ok) alert(res.message);
              router.refresh();
            });
          }}
        >
          {isSelf ? "Выйти" : "Удалить"}
        </Button>
      ) : null}
    </div>
  );
}
