export type MemberRole = "owner" | "admin" | "editor" | "viewer";

export type Household = {
  id: string;
  name: string;
  currency: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
};
