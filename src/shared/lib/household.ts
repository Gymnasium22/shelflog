import { createClient } from "@/shared/api/supabase/server";
import type {
  Household,
  HouseholdMember,
  MemberRole,
} from "@/entities/household/model/types";

/**
 * Returns the first household for the current user (MVP: single active home).
 */
export async function getActiveHousehold(): Promise<Household | null> {
  const ctx = await getActiveHouseholdContext();
  return ctx?.household ?? null;
}

export type HouseholdContext = {
  household: Household;
  membership: HouseholdMember;
  role: MemberRole;
  userId: string;
};

export async function getActiveHouseholdContext(): Promise<HouseholdContext | null> {
  const supabase = await createClient();
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

export async function requireHousehold(): Promise<Household> {
  const household = await getActiveHousehold();
  if (!household) {
    throw new Error("HOUSEHOLD_REQUIRED");
  }
  return household;
}
