import Link from "next/link";
import { redirect } from "next/navigation";

import {
  DOCUMENT_TYPE_LABELS,
  type Document,
  type DocumentType,
} from "@/entities/document/model/types";
import { formatFileSize } from "@/shared/lib/files";
import { createClient } from "@/shared/api/supabase/server";
import { getActiveHousehold } from "@/shared/lib/household";

export const metadata = { title: "Документы" };

export default async function DocumentsPage() {
  const household = await getActiveHousehold();
  if (!household) redirect("/app");

  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("household_id", household.id)
    .order("created_at", { ascending: false });

  const docs = (data as Document[] | null) ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Документы</h1>
          <p className="text-sm text-muted">
            Цифровые копии + где лежит бумажный оригинал.
          </p>
        </div>
        <Link
          href="/app/documents/new"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
        >
          Загрузить
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted">Документов пока нет.</p>
          <Link
            href="/app/documents/new"
            className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            Загрузить первый
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/app/documents/${doc.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-border/20"
              >
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-xs text-muted">
                    {DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ??
                      doc.type}{" "}
                    · {formatFileSize(doc.file_size)}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {doc.mime_type.includes("pdf") ? "PDF" : "IMG"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
