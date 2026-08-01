"use client";

import { useTransition } from "react";

import { acceptInviteAction } from "@/features/family/api/actions";
import { Button } from "@/shared/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      className="w-full"
      onClick={() => {
        start(async () => {
          const res = await acceptInviteAction(token);
          if (res && !res.ok && res.message !== "auth_required") {
            alert(res.message);
          }
        });
      }}
    >
      {pending ? "Принимаем…" : "Вступить в дом"}
    </Button>
  );
}
