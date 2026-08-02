"use client";

import { useCallback, useEffect, useState } from "react";

import type { Household } from "@/entities/household/model/types";
import { getHousehold } from "@/shared/lib/local-db";

/** `null` while reading localStorage on the client. */
export function useLocalHousehold() {
  const [household, setHousehold] = useState<Household | null | undefined>(
    undefined,
  );

  const refresh = useCallback(() => {
    setHousehold(getHousehold());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    household: household ?? null,
    ready: household !== undefined,
    refresh,
  };
}
