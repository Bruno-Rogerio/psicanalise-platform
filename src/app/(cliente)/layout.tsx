"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

const navItems = [
  { label: "Início", href: "/dashboard", icon: HomeIcon },
  { label: "Agendar", href: "/agenda", icon: CalendarIcon },
  { label: "Minhas Sessões", href: "/minhas-sessoes", icon: ClockIcon },
];

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", auth.user.id)
          .single();
        setUserName(profile?.nome ?? null);
      }
    }
    loadUser();
  }, []);

  // Pega a inicial do nome
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "?";
  const firstName = userName ? userName.split(" ")[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-100 via-warm-100 to-soft-100/30">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-rose-400/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-soft-400/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-warm-300/40 bg-warm-100/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400/20 to-warm-500/20 text-lg font-semibold text-warm-900 transition-transform duration-300 group-hover:scale-105">
              Ψ
            </span>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold tracking-tight text-warm-900">
                Área do Cliente
              </span>
              {firstName && (
                <p className="text-xs text-warm-600">Olá, {firstName}</p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white text-warm-900 shadow-soft"
                      : "text-warm-600 hover:bg-white/50 hover:text-warm-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User menu - Desktop */}
            <div className="hidden items-center gap-3 md:flex">
              {/* Avatar com círculo visível */}
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-sage-300 bg-gradient-to-br from-sage-100 to-sage-200 text-sm font-bold text-sage-700 shadow-sm">
                  {userInitial}
                </div>
                {firstName && (
                  <span className="text-sm font-medium text-warm-800">
                    {firstName}
                  </span>
                )}
              </div>

              <div className="h-6 w-px bg-warm-300/50" />

              <Link
                href="/logout"
                className="inline-flex items-center gap-2 rounded-xl border border-warm-300/60 bg-white px-4 py-2 text-sm font-medium text-warm-700 transition-all duration-300 hover:bg-warm-50 hover:text-warm-900 hover:shadow-soft"
              >
                <LogoutIcon className="h-4 w-4" />
                Sair
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 transition-colors hover:bg-white/50 hover:text-warm-900 md:hidden"
            >
              {menuOpen ? (
                <XIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-warm-300/40 bg-warm-100/95 backdrop-blur-md md:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-5 py-4">
              {/* Mobile user info */}
              <div className="mb-4 flex items-center gap-3 border-b border-warm-300/40 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-sage-300 bg-gradient-to-br from-sage-100 to-sage-200 text-base font-bold text-sage-700 shadow-sm">
                  {userInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-900">
                    {userName || "Usuário"}
                  </p>
                  <p className="text-xs text-warm-600">Área do cliente</p>
                </div>
              </div>

              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-white text-warm-900 shadow-soft"
                        : "text-warm-600 hover:bg-white/50 hover:text-warm-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="border-t border-warm-300/40 pt-4">
                <Link
                  href="/logout"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogoutIcon className="h-5 w-5" />
                  Sair da conta
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-warm-300/40 bg-warm-100/60">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-warm-500">
              Seus dados estão protegidos com criptografia e sigilo
              profissional.
            </p>
            <p className="text-xs text-warm-500">
              © {new Date().getFullYear()} • Psicanálise Online
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons
function HomeIcon({ className }: { className?: string }) {
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
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
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

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
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
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

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

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
