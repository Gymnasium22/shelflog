/**
 * Absolute app origin for deep links (QR, magic link).
 */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

export function qrDeepLink(token: string): string {
  return `${getAppOrigin()}/q/${encodeURIComponent(token)}`;
}

export type QrEntityType = "item" | "box" | "location" | "document";

export function pathForQrEntity(
  entityType: QrEntityType,
  entityId: string,
): string {
  switch (entityType) {
    case "item":
      return `/app/items/${entityId}`;
    case "box":
      return `/app/boxes/${entityId}`;
    case "location":
      return `/app/locations/${entityId}`;
    case "document":
      return `/app/documents/${entityId}`;
    default:
      return "/app";
  }
}

export const QR_ENTITY_LABELS: Record<QrEntityType, string> = {
  item: "Вещь",
  box: "Коробка",
  location: "Место",
  document: "Документ",
};
