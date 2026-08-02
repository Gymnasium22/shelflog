"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getHousehold } from "@/shared/lib/local-db";

/** Skip landing only when a local household already exists. */
export function RedirectToApp() {
  const router = useRouter();

  useEffect(() => {
    if (getHousehold()) {
      router.replace("/app");
    }
  }, [router]);

  return null;
}
