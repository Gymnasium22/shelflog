export const SEARCH_ENTITY_TYPES = [
  "item",
  "box",
  "document",
  "location",
] as const;

export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

export type SearchHit = {
  entity_type: SearchEntityType;
  entity_id: string;
  title: string;
  subtitle: string | null;
  rank: number;
  meta: Record<string, unknown> | null;
};

export const SEARCH_ENTITY_LABELS: Record<SearchEntityType, string> = {
  item: "Вещь",
  box: "Коробка",
  document: "Документ",
  location: "Место",
};

export function hrefForSearchHit(hit: SearchHit): string {
  switch (hit.entity_type) {
    case "item":
      return `/app/items/${hit.entity_id}`;
    case "box":
      return `/app/boxes/${hit.entity_id}`;
    case "document":
      return `/app/documents/${hit.entity_id}`;
    case "location":
      return `/app/locations/${hit.entity_id}`;
    default:
      return "/app/search";
  }
}
