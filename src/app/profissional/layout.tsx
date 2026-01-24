import Link from "next/link";
import { ProfissionalSidebar } from "@/components/layout/ProfissionalSidebar";

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex">
        <ProfissionalSidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  ← Voltar
                </Link>

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-zinc-900">
                    Área do profissional
                  </p>
                  <p className="text-xs text-zinc-500">
                    Agenda, sessões, prontuários e configurações
                  </p>
                </div>
              </div>

              {/* Ações do topo (deixa pronto pra depois) */}
              <div className="flex items-center gap-2">
                <Link
                  href="/profissional/agenda"
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Ir para agenda
                </Link>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
                {children}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-zinc-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-zinc-500 sm:px-6">
              Sigilo e ética em todas as sessões • © {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
