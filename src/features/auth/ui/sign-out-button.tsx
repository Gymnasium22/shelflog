"use client";

import { useTransition } from "react";

import { signOut } from "@/features/auth/api/actions";
import { Button } from "@/shared/ui/button";

export function SignOutButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => signOut())}
    >
      {pending ? "Выходим…" : "Выйти"}
    </Button>
  );
}
