export const DOCUMENT_TYPES = [
  "receipt",
  "manual",
  "warranty",
  "contract",
  "device_passport",
  "certificate",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type Document = {
  id: string;
  household_id: string;
  item_id: string | null;
  box_id: string | null;
  title: string;
  type: DocumentType;
  mime_type: string;
  storage_path: string;
  file_size: number | null;
  original_location_id: string | null;
  issued_at: string | null;
  notes: string | null;
  qr_token: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  receipt: "Чек",
  manual: "Инструкция",
  warranty: "Гарантия",
  contract: "Договор",
  device_passport: "Паспорт устройства",
  certificate: "Сертификат",
  other: "Другое",
};

export const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20 MB

export const DOCUMENTS_BUCKET = "documents" as const;
