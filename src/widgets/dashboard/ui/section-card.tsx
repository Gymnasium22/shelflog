import Link from "next/link";

export function SectionCard({
  title,
  href,
  hrefLabel = "Все",
  children,
  empty,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  empty?: { text: string; href?: string; cta?: string };
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            {hrefLabel}
          </Link>
        ) : null}
      </div>
      <div className="flex-1 p-2">
        {empty ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm text-muted">{empty.text}</p>
            {empty.href && empty.cta ? (
              <Link
                href={empty.href}
                className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
              >
                {empty.cta}
              </Link>
            ) : null}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function ListLink({
  href,
  title,
  meta,
  accent,
}: {
  href: string;
  title: string;
  meta?: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-border/25"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        {meta ? <p className="truncate text-xs text-muted">{meta}</p> : null}
      </div>
      {accent ? (
        <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-300">
          {accent}
        </span>
      ) : null}
    </Link>
  );
}
