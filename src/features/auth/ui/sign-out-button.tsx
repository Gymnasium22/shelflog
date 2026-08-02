"use client";

import { useTransition } from "react";

import { signOutClient } from "@/features/auth/api/client-auth";
import { Button } from "@/shared/ui/button";

export function SignOutButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => signOutClient())}
    >
      {pending ? "Выходим…" : "Выйти"}
    </Button>
  );
}
