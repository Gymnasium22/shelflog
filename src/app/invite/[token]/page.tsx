import Link from "next/link";
import { redirect } from "next/navigation";

import {
  MEMBER_ROLE_LABELS,
  type InviteRole,
} from "@/entities/household/model/roles";
import type { MemberRole } from "@/entities/household/model/types";
import { AcceptInviteButton } from "@/features/family/ui/accept-invite-button";
import { createClient } from "@/shared/api/supabase/server";

export const metadata = { title: "Приглашение" };

type Props = { params: Promise<{ token: string }> };

type Preview = {
  household_id: string;
  household_name: string;
  role: MemberRole;
  email: string | null;
  expires_at: string;
  status: string;
  is_expired: boolean;
};

export default async function InvitePage({ params }: Props) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const { data, error } = await supabase.rpc("preview_invitation", {
    p_token: token,
  });

  const preview = (Array.isArray(data) ? data[0] : data) as Preview | null;

  if (error || !preview) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Приглашение не найдено</h1>
        <p className="text-sm text-muted">
          Ссылка неверная или устарела. Попросите новую у владельца дома.
        </p>
        <Link href="/app" className="text-sm font-medium underline-offset-4 hover:underline">
          На главную
        </Link>
      </Shell>
    );
  }

  if (preview.status !== "pending" || preview.is_expired) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Приглашение недоступно</h1>
        <p className="text-sm text-muted">
          Статус: {preview.is_expired ? "истекло" : preview.status}.
        </p>
        <Link href="/app" className="text-sm font-medium underline-offset-4 hover:underline">
          На главную
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-sm font-medium tracking-wide text-muted uppercase">
        ShelfLog
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Приглашение в «{preview.household_name}»
      </h1>
      <p className="text-sm text-muted">
        Вам предлагают роль{" "}
        <span className="font-medium text-foreground">
          {MEMBER_ROLE_LABELS[preview.role] ??
            MEMBER_ROLE_LABELS[preview.role as InviteRole & MemberRole] ??
            preview.role}
        </span>
        .
        {preview.email
          ? ` Приглашение для ${preview.email}.`
          : " Приглашение по ссылке."}
      </p>
      <p className="text-xs text-muted">
        Действует до{" "}
        {new Date(preview.expires_at).toLocaleString("ru-BY")}
      </p>
      <AcceptInviteButton token={token} />
      <Link
        href="/app"
        className="text-center text-sm text-muted underline-offset-4 hover:underline"
      >
        Отмена
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-6 py-16">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}
