"use client";

import { useActionState, useEffect, useState } from "react";

import {
  INVITE_ROLE_LABELS,
  INVITE_ROLES,
  type InviteRole,
} from "@/entities/household/model/roles";
import {
  createInviteAction,
  type ActionState,
} from "@/features/family/api/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const empty: ActionState = { ok: true, message: null };

export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [state, action, pending] = useActionState(createInviteAction, empty);
  const [copied, setCopied] = useState(false);

  const roles = canInviteAdmin
    ? INVITE_ROLES
    : (["editor", "viewer"] as InviteRole[]);

  useEffect(() => {
    setCopied(false);
  }, [state.inviteUrl]);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">
          Пригласить в семью
        </h2>
        <p className="mt-1 text-xs text-muted">
          Ссылка действует 14 дней. Email необязателен — можно просто
          отправить ссылку.
        </p>
      </div>

      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email (опционально)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="family@example.com"
            />
          </div>
          <div>
            <Label htmlFor="role">Роль</Label>
            <select
              id="role"
              name="role"
              defaultValue="editor"
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {INVITE_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Создаём…" : "Создать ссылку"}
        </Button>
      </form>

      {state.message ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            state.ok
              ? "border border-emerald-500/30 bg-emerald-500/10"
              : "border border-amber-500/30 bg-amber-500/10"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {state.inviteUrl ? (
        <div className="space-y-2 rounded-xl border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted">Ссылка-приглашение</p>
          <p className="break-all font-mono text-xs">{state.inviteUrl}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.inviteUrl!);
                setCopied(true);
              } catch {
                prompt("Скопируйте ссылку:", state.inviteUrl!);
              }
            }}
          >
            {copied ? "Скопировано" : "Копировать"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
