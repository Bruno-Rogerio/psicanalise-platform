"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

const navItems = [
  { label: "Dashboard", href: "/profissional", icon: DashboardIcon },
  { label: "Agenda", href: "/profissional/agenda", icon: CalendarIcon },
  { label: "Pacientes", href: "/profissional/pacientes", icon: UsersIcon },
  { label: "Sessões", href: "/profissional/sessoes", icon: VideoIcon },
  { label: "Financeiro", href: "/profissional/financeiro", icon: WalletIcon },
  { label: "Produtos", href: "/profissional/produtos", icon: PackageIcon },
  { label: "Validar PIX", href: "/profissional/pagamentos-pix", icon: PixIcon },
  {
    label: "Configurações",
    href: "/profissional/configuracoes",
    icon: SettingsIcon,
  },
];

export function PendingPixAlert() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadPendingCount() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) return;

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("profissional_id", auth.user.id)
      .eq("payment_method", "pix")
      .eq("status", "pending_pix");

    setCount(count || 0);
  }

  if (count === 0) return null;

  return (
    <Link
      href="/profissional/pagamentos-pix"
      className="block rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 shadow-soft transition-all hover:shadow-soft-lg"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
          <AlertIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-amber-900">
            {count} pagamento{count > 1 ? "s" : ""} PIX pendente
            {count > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Clique para validar e liberar créditos dos clientes
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
          {count}
        </div>
      </div>
    </Link>
  );
}

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "P";
  const firstName = userName ? userName.split(" ")[0] : "Profissional";

  const currentPageLabel = useMemo(() => {
    const found = navItems.find((item) =>
      item.href === "/profissional"
        ? pathname === "/profissional"
        : pathname.startsWith(item.href),
    );
    return found?.label || "Painel Profissional";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-100 via-warm-50 to-soft-100/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-warm-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-warm-200 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between border-b border-warm-200 px-6">
          <Link href="/profissional" className="group flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Raiza Convento Psicanálise"
              width={180}
              height={54}
              priority
              className="h-11 w-auto transition-opacity duration-300 group-hover:opacity-85"
            />
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-500 hover:bg-warm-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="border-b border-warm-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-sage-50 to-soft-50 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-sage-300 bg-gradient-to-br from-sage-100 to-sage-200 text-lg font-bold text-sage-700 shadow-sm">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-warm-900">
                {firstName}
              </p>
              <p className="text-xs text-warm-500">Profissional</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-warm-400">
            Menu
          </p>

          {navItems.map((item) => {
            const isActive =
              item.href === "/profissional"
                ? pathname === "/profissional"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={[
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#4A7C59] text-white shadow-md"
                    : "text-warm-700 hover:bg-warm-100 hover:text-warm-900",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-warm-400 group-hover:text-warm-600",
                  ].join(" ")}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-warm-200 p-4">
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-warm-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogoutIcon className="h-5 w-5" />
            Sair da conta
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 hover:bg-warm-100 lg:hidden"
                aria-label="Abrir menu"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              {/* Mobile title */}
              <div className="lg:hidden">
                <p className="text-sm font-semibold text-warm-900">
                  {currentPageLabel}
                </p>
                <p className="text-xs text-warm-500">Painel Profissional</p>
              </div>

              {/* Desktop line */}
              <div className="hidden lg:flex items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-warm-200 bg-warm-50 px-3 py-1 text-xs font-semibold tracking-wide text-warm-800">
                  Painel Profissional
                </span>

                <p className="text-sm text-warm-500">
                  Bem-vindo(a) de volta,{" "}
                  <span className="font-semibold text-warm-900">
                    {firstName}
                  </span>
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 transition-colors hover:bg-warm-100"
                aria-label="Notificações"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>

              {/* Quick action */}
              <Link
                href="/profissional/agenda"
                className="hidden items-center gap-2 rounded-xl bg-[#4A7C59] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#3d6649] hover:shadow-lg sm:flex"
              >
                <CalendarIcon className="h-4 w-4" />
                Ver Agenda
              </Link>

              {/* User avatar - mobile */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-sage-300 bg-gradient-to-br from-sage-100 to-sage-200 text-sm font-bold text-sage-700 lg:hidden">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <PendingPixAlert />
          </div>
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-warm-200/60 bg-white/60 px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-warm-500 sm:flex-row">
            <p>Sigilo e ética profissional em todas as sessões</p>
            <p>© {new Date().getFullYear()} • Psicanálise Online</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ========== ICONS ==========

function PackageIcon({ className }: { className?: string }) {
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
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function PixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.2 6.4L12 9.6 8.8 6.4 6.4 8.8 9.6 12l-3.2 3.2 2.4 2.4L12 14.4l3.2 3.2 2.4-2.4L14.4 12l3.2-3.2z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
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
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
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
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
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

function UsersIcon({ className }: { className?: string }) {
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
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
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
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
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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

function BellIcon({ className }: { className?: string }) {
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
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
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
