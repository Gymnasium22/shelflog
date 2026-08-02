type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <div className="animate-fade-up space-y-2">
      {eyebrow ? (
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[1.85rem] font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-xl text-[15px] leading-relaxed text-muted text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}
