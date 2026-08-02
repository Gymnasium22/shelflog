import { createClient } from "@/shared/api/supabase/client";
import type {
  Household,
  HouseholdMember,
  MemberRole,
} from "@/entities/household/model/types";

export type HouseholdContext = {
  household: Household;
  membership: HouseholdMember;
  role: MemberRole;
  userId: string;
};

export async function getActiveHouseholdClient(): Promise<Household | null> {
  const ctx = await getActiveHouseholdContextClient();
  return ctx?.household ?? null;
}

export async function getActiveHouseholdContextClient(): Promise<HouseholdContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membershipRow } = await supabase
    .from("household_members")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const membership = membershipRow as HouseholdMember | null;
  if (!membership?.household_id) return null;

  const { data: householdRow } = await supabase
    .from("households")
    .select("*")
    .eq("id", membership.household_id)
    .maybeSingle();

  const household = householdRow as Household | null;
  if (!household) return null;

  return {
    household,
    membership,
    role: membership.role,
    userId: user.id,
  };
}
