import type { SearchEntityType, SearchHit } from "@/features/search/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export type SearchParams = {
  q?: string;
  types?: SearchEntityType[];
  itemStatus?: string;
  documentType?: string;
  limit?: number;
};

export async function searchHousehold(
  params: SearchParams,
): Promise<{ hits: SearchHit[]; error: string | null; householdId: string | null }> {
  const household = await getActiveHousehold();
  if (!household) {
    return { hits: [], error: "Сначала создайте дом", householdId: null };
  }

  const q = (params.q ?? "").trim();
  const hasFilters = Boolean(params.itemStatus || params.documentType);
  if (!q && !hasFilters) {
    return { hits: [], error: null, householdId: household.id };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_household", {
    p_household_id: household.id,
    p_query: q,
    p_limit: params.limit ?? 40,
    p_types: params.types?.length ? params.types : null,
    p_item_status: params.itemStatus || null,
    p_document_type: params.documentType || null,
  });

  if (error) {
    return { hits: [], error: error.message, householdId: household.id };
  }

  const hits = ((data as SearchHit[] | null) ?? []).map((row) => ({
    ...row,
    meta:
      row.meta && typeof row.meta === "object"
        ? (row.meta as Record<string, unknown>)
        : null,
  }));

  return { hits, error: null, householdId: household.id };
}
