"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { INVITE_ROLE_LABELS, type InviteRole } from "@/entities/household/model/roles";
import { revokeInviteAction } from "@/features/family/api/actions";
import { Button } from "@/shared/ui/button";

export function PendingInviteRow({
  id,
  token,
  role,
  email,
  expiresAt,
  inviteUrl,
}: {
  id: string;
  token: string;
  role: string;
  email: string | null;
  expiresAt: string;
  inviteUrl: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  void token;
  const url = inviteUrl;

  return (
    <li className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {INVITE_ROLE_LABELS[role as InviteRole] ?? role}
          {email ? ` · ${email}` : " · ссылка"}
        </p>
        <p className="text-xs text-muted">
          до {new Date(expiresAt).toLocaleString("ru-BY")}
        </p>
        <p className="mt-1 break-all font-mono text-[11px] text-muted">{url}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-9 text-xs"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
            } catch {
              prompt("Скопируйте:", url);
            }
          }}
        >
          Копировать
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 text-xs"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const res = await revokeInviteAction(id);
              if (!res.ok) alert(res.message);
              router.refresh();
            });
          }}
        >
          Отозвать
        </Button>
      </div>
    </li>
  );
}
