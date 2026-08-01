"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  ALLOWED_DOCUMENT_MIME,
  DOCUMENTS_BUCKET,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type DocumentType,
} from "@/entities/document/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";
import { sanitizeFileName } from "@/shared/lib/files";

export type ActionState = {
  ok: boolean;
  message: string | null;
};

const metaSchema = z.object({
  title: z.string().trim().min(1, "Введите название").max(200),
  type: z.enum(DOCUMENT_TYPES),
  itemId: z.string().uuid().nullable(),
  boxId: z.string().uuid().nullable(),
  originalLocationId: z.string().uuid().nullable(),
  issuedAt: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
});

function emptyToNull(v: string) {
  return v === "" ? null : v;
}

export async function createDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Выберите файл" };
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, message: "Файл больше 20 МБ" };
  }

  const mime = file.type || "application/octet-stream";
  if (
    !(ALLOWED_DOCUMENT_MIME as readonly string[]).includes(mime) &&
    // Some browsers send empty type for HEIC
    !file.name.toLowerCase().match(/\.(heic|heif)$/)
  ) {
    return {
      ok: false,
      message: "Допустимы PDF, JPEG, PNG, WEBP, HEIC",
    };
  }

  const resolvedMime =
    mime === "application/octet-stream" &&
    file.name.toLowerCase().match(/\.(heic|heif)$/)
      ? "image/heic"
      : mime;

  if (
    !(ALLOWED_DOCUMENT_MIME as readonly string[]).includes(resolvedMime)
  ) {
    return {
      ok: false,
      message: "Допустимы PDF, JPEG, PNG, WEBP, HEIC",
    };
  }

  const parsed = metaSchema.safeParse({
    title: formData.get("title") || file.name.replace(/\.[^.]+$/, ""),
    type: formData.get("type") || "other",
    itemId: emptyToNull(String(formData.get("itemId") ?? "")),
    boxId: emptyToNull(String(formData.get("boxId") ?? "")),
    originalLocationId: emptyToNull(
      String(formData.get("originalLocationId") ?? ""),
    ),
    issuedAt: String(formData.get("issuedAt") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте поля",
    };
  }

  const household = await getActiveHousehold();
  if (!household) {
    return { ok: false, message: "Сначала создайте дом" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Нужно войти" };
  }

  const documentId = crypto.randomUUID();
  const safeName = sanitizeFileName(file.name || "file");
  const storagePath = `${household.id}/${documentId}_${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: resolvedMime,
      upsert: false,
    });

  if (uploadError) {
    return {
      ok: false,
      message: `Не удалось загрузить файл: ${uploadError.message}`,
    };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      household_id: household.id,
      title: parsed.data.title,
      type: parsed.data.type as DocumentType,
      mime_type: resolvedMime,
      storage_path: storagePath,
      file_size: file.size,
      item_id: parsed.data.itemId,
      box_id: parsed.data.boxId,
      original_location_id: parsed.data.originalLocationId,
      issued_at: parsed.data.issuedAt ?? null,
      notes: parsed.data.notes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return { ok: false, message: error.message };
  }

  const row = data as { id: string };
  revalidatePath("/app/documents");
  revalidatePath("/app");
  if (parsed.data.itemId) {
    revalidatePath(`/app/items/${parsed.data.itemId}`);
  }
  redirect(`/app/documents/${row.id}`);
}

export async function deleteDocumentAction(id: string): Promise<ActionState> {
  const household = await getActiveHousehold();
  if (!household) return { ok: false, message: "Нет дома" };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .eq("household_id", household.id)
    .maybeSingle();

  const doc = row as { id: string; storage_path: string } | null;
  if (!doc) return { ok: false, message: "Документ не найден" };

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("household_id", household.id);

  if (error) return { ok: false, message: error.message };

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]);

  revalidatePath("/app/documents");
  revalidatePath("/app");
  return { ok: true, message: "Удалено" };
}

export async function getDocumentSignedUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const household = await getActiveHousehold();
  if (!household) return null;

  if (!storagePath.startsWith(`${household.id}/`)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
