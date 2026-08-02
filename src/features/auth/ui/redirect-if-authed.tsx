"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/shared/api/supabase/client";

type Props = {
  next?: string;
};

export function RedirectIfAuthed({ next = "/app" }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next);
    });
  }, [next, router]);

  return null;
}
