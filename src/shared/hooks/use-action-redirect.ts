"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import type { ActionState } from "@/shared/types/action-state";

export function useActionRedirect(state: ActionState) {
  const router = useRouter();

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.redirectTo]);
}
