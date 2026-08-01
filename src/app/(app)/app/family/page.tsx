import Link from "next/link";
import { redirect } from "next/navigation";

import {
  MEMBER_ROLE_HINTS,
  MEMBER_ROLE_LABELS,
  canManageMembers,
} from "@/entities/household/model/roles";
import type { MemberRole } from "@/entities/household/model/types";
import { InviteForm } from "@/features/family/ui/invite-form";
import { MemberRowActions } from "@/features/family/ui/member-row-actions";
import { PendingInviteRow } from "@/features/family/ui/pending-invite-row";
import { createClient } from "@/shared/api/supabase/server";
import { getAppOrigin } from "@/shared/lib/app-url";
import { getActiveHouseholdContext } from "@/shared/lib/household";

export const metadata = { title: "Семья" };

type MemberRow = {
  id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  display_name: string | null;
  email: string | null;
};

type InviteRow = {
  id: string;
  token: string;
  role: string;
  email: string | null;
  expires_at: string;
  status: string;
};

export default async function FamilyPage() {
  const ctx = await getActiveHouseholdContext();
  if (!ctx) redirect("/app");

  const supabase = await createClient();
  const manage = canManageMembers(ctx.role);

  const [{ data: membersRaw }, invitesRes] = await Promise.all([
    supabase
      .from("household_members")
      .select("id, user_id, role, created_at")
      .eq("household_id", ctx.household.id)
      .order("created_at", { ascending: true }),
    manage
      ? supabase
          .from("invitations")
          .select("id, token, role, email, expires_at, status")
          .eq("household_id", ctx.household.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as InviteRow[] }),
  ]);

  const baseMembers =
    (membersRaw as
      | { id: string; user_id: string; role: MemberRole; created_at: string }[]
      | null) ?? [];

  const userIds = baseMembers.map((m) => m.user_id);
  const { data: profilesRaw } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (
      (profilesRaw as
        | { id: string; display_name: string | null; email: string | null }[]
        | null) ?? []
    ).map((p) => [p.id, p]),
  );

  const members: MemberRow[] = baseMembers.map((m) => {
    const p = profileMap.get(m.user_id);
    return {
      ...m,
      display_name: p?.display_name ?? null,
      email: p?.email ?? null,
    };
  });

  const invites = (invitesRes.data as InviteRow[] | null) ?? [];

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Семья</h1>
        <p className="text-sm text-muted">
          {ctx.household.name} · ваша роль:{" "}
          <span className="font-medium text-foreground">
            {MEMBER_ROLE_LABELS[ctx.role]}
          </span>
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          Роли
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(MEMBER_ROLE_HINTS) as MemberRole[]).map((r) => (
            <li key={r} className="rounded-xl border border-border/70 px-3 py-2">
              <p className="text-sm font-medium">{MEMBER_ROLE_LABELS[r]}</p>
              <p className="text-xs text-muted">{MEMBER_ROLE_HINTS[r]}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          Участники ({members.length})
        </h2>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {m.display_name || m.email || "Участник"}
                </p>
                <p className="truncate text-xs text-muted">
                  {m.email ?? m.user_id}
                </p>
              </div>
              <MemberRowActions
                memberId={m.id}
                currentRole={m.role}
                isSelf={m.user_id === ctx.userId}
                myRole={ctx.role}
              />
            </li>
          ))}
        </ul>
      </section>

      {manage ? (
        <>
          <InviteForm canInviteAdmin={ctx.role === "owner"} />

          <section className="space-y-3">
            <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
              Ожидают принятия ({invites.length})
            </h2>
            {invites.length === 0 ? (
              <p className="text-sm text-muted">Активных приглашений нет.</p>
            ) : (
              <ul className="rounded-2xl border border-border bg-card">
                {invites.map((inv) => (
                  <PendingInviteRow
                    key={inv.id}
                    id={inv.id}
                    token={inv.token}
                    role={inv.role}
                    email={inv.email}
                    expiresAt={inv.expires_at}
                    inviteUrl={`${getAppOrigin()}/invite/${inv.token}`}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">
          Приглашать участников могут владелец и админ.
        </p>
      )}

      <p className="text-xs text-muted">
        <Link href="/app" className="underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
      </p>
    </main>
  );
}
