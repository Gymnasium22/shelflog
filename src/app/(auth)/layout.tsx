export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 space-y-2 text-center">
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          ShelfLog
        </p>
        <p className="text-sm text-muted">Цифровой паспорт дома</p>
      </div>
      {children}
    </div>
  );
}
