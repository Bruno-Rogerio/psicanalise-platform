import Link from "next/link";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EEF3EF] text-[#1F1F1F]">
      <header className="sticky top-0 z-40 border-b border-[#D6DED9] bg-[#EEF3EF]/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DED9] bg-white text-sm font-semibold">
              Ψ
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              Área do cliente
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-sm font-medium text-[#5F6B64] hover:bg-white/60 hover:text-zinc-900"
            >
              Início
            </Link>
            <Link
              href="/logout"
              className="rounded-md border border-[#D6DED9] bg-white px-3 py-2 text-sm font-medium hover:bg-white/60"
            >
              Sair
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6">{children}</main>
    </div>
  );
}
