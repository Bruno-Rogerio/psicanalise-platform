"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationBell } from "@/components/notifications";

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  // Fecha o menu ao navegar
  useEffect(() => { setUserMenuOpen(false); }, [pathname]);

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "?";
  const firstName = userName ? userName.split(" ")[0] : null;

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#F2EDE8]">
        {/* Header — dark, premium */}
        <header
          className="sticky top-0 z-40 backdrop-blur-md"
          style={{ background: "rgba(26,22,20,0.95)", height: "60px" }}
        >
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-6">
            {/* Brand + badge */}
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3"
            >
              <SiteLogo
                width={140}
                height={42}
                priority
                className="h-9 w-auto transition-opacity duration-300 group-hover:opacity-80"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span
                className="hidden sm:inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold tracking-wide"
                style={{
                  background: "rgba(212,167,44,0.15)",
                  color: "#D4A72C",
                  borderColor: "rgba(212,167,44,0.30)",
                }}
              >
                Área do Cliente
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/8 hover:text-white"
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
              {/* Notifications */}
              <div className="text-white/70">
                <NotificationBell />
              </div>

              {/* User avatar + name — desktop */}
              <div className="hidden items-center gap-3 md:flex">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "#4A7C59" }}
                  >
                    {userInitial}
                  </div>
                  {firstName && (
                    <span className="text-sm font-medium text-white">
                      {firstName}
                    </span>
                  )}
                </div>

                <div
                  className="h-5 w-px"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                />

                <Link
                  href="/logout"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-1.5 text-sm font-medium text-white/80 transition-all duration-200 hover:border-white/40 hover:text-white"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Sair
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
          {children}
        </main>

        {/* Footer — desktop only */}
        <footer
          className="relative z-10 hidden border-t sm:block"
          style={{ borderColor: "rgba(26,22,20,0.10)", background: "#F2EDE8" }}
        >
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs" style={{ color: "rgba(26,22,20,0.40)" }}>
                Seus dados estão protegidos com criptografia e sigilo profissional.
              </p>
              <p className="text-xs" style={{ color: "rgba(26,22,20,0.40)" }}>
                © {new Date().getFullYear()} • Raiza Convento - Psicanalista
              </p>
            </div>
          </div>
        </footer>

        {/* Overlay do menu de conta */}
        {userMenuOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setUserMenuOpen(false)}
          />
        )}

        {/* Slide-up painel de conta */}
        <div
          className={`fixed left-0 right-0 z-50 border-t border-white/10 bg-[#1A1614] transition-all duration-300 md:hidden ${
            userMenuOpen ? "bottom-16 opacity-100" : "bottom-16 translate-y-full opacity-0 pointer-events-none"
          }`}
          style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.4)" }}
        >
          <div className="p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "#4A7C59" }}
              >
                {userInitial}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{userName || "Minha conta"}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Área do Cliente</p>
              </div>
            </div>
            <Link
              href="/logout"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-400 transition-all hover:bg-white/5"
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
              Sair da conta
            </Link>
          </div>
        </div>

        {/* Bottom nav bar — mobile only */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe md:hidden"
          style={{
            background: "#1A1614",
            height: "64px",
            boxShadow: "0 -1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-opacity duration-150"
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: isActive ? "#E8755A" : "rgba(255,255,255,0.45)" }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? "#E8755A" : "rgba(255,255,255,0.45)" }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
                    style={{ background: "#E8755A" }}
                  />
                )}
              </Link>
            );
          })}

          {/* Conta / logout */}
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-opacity duration-150"
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: userMenuOpen ? "#E8755A" : "rgba(255,255,255,0.15)",
                color: userMenuOpen ? "white" : "rgba(255,255,255,0.6)",
              }}
            >
              {userInitial}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{ color: userMenuOpen ? "#E8755A" : "rgba(255,255,255,0.45)" }}
            >
              Conta
            </span>
            {userMenuOpen && (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
                style={{ background: "#E8755A" }}
              />
            )}
          </button>
        </nav>
      </div>
    </NotificationProvider>
  );
}

// Icons
function HomeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
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

function CalendarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
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

function ClockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
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
