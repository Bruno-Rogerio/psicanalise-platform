"use client";

import Link from "next/link";
import { useState } from "react";
import { ProfissionalSidebar } from "@/components/layout/ProfissionalSidebar";

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-100 via-warm-100 to-soft-100/30">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-sage-400/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-soft-400/5 blur-3xl" />
      </div>

      <div className="relative flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ProfissionalSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-warm-900/20 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-64">
              <ProfissionalSidebar />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-40 border-b border-warm-300/40 bg-warm-100/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 transition-colors hover:bg-white/50 hover:text-warm-900 lg:hidden"
                >
                  <MenuIcon className="h-5 w-5" />
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-warm-300/60 bg-white/80 px-4 py-2 text-sm font-medium text-warm-700 transition-all duration-300 hover:bg-white hover:shadow-soft"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Voltar ao site</span>
                </Link>

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-warm-900">
                    Área do profissional
                  </p>
                  <p className="text-xs text-muted">
                    Agenda, sessões, prontuários e configurações
                  </p>
                </div>
              </div>

              {/* Topbar actions */}
              <div className="flex items-center gap-2">
                <Link
                  href="/profissional/agenda"
                  className="inline-flex items-center gap-2 rounded-xl bg-sage-500 px-4 py-2 text-sm font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Ir para agenda</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 p-5 shadow-soft backdrop-blur-sm sm:p-6">
                {children}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-warm-300/40 bg-warm-100/60">
            <div className="px-4 py-4 sm:px-6">
              <p className="text-center text-xs text-muted">
                Sigilo e ética em todas as sessões • ©{" "}
                {new Date().getFullYear()} Psicanálise Online
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Icons
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
