type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <div className="space-y-1.5">
      {eyebrow ? (
        <p className="text-xs font-medium tracking-wide text-accent uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      {description ? (
        <p className="max-w-xl text-sm text-muted text-pretty">{description}</p>
      ) : null}
    </div>
  );
}
