"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationBell } from "@/components/notifications";

const navItems = [
  { label: "Dashboard", href: "/profissional", icon: DashboardIcon },
  { label: "Agenda", href: "/profissional/agenda", icon: CalendarIcon },
  { label: "Pacientes", href: "/profissional/pacientes", icon: UsersIcon },
  { label: "Usuarios", href: "/profissional/usuarios", icon: UsersIcon },
  { label: "Sessões", href: "/profissional/sessoes", icon: VideoIcon },
  { label: "Financeiro", href: "/profissional/financeiro", icon: WalletIcon },
  { label: "Produtos", href: "/profissional/produtos", icon: PackageIcon },
  { label: "Blog", href: "/profissional/blog", icon: BlogIcon },
  { label: "Validar PIX", href: "/profissional/pagamentos-pix", icon: PixIcon },
  { label: "Link de Pagamento", href: "/profissional/link-pagamento", icon: LinkIcon },
  { label: "Analytics", href: "/profissional/analytics", icon: AnalyticsIcon },
  { label: "Configurações", href: "/profissional/configuracoes", icon: SettingsIcon },
];

export function PendingPixAlert() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let userId: string | null = null;

    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) return;
      userId = auth.user.id;

      await fetchCount(userId);

      const channel = supabase
        .channel("pix-pending-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `profissional_id=eq.${userId}`,
          },
          () => fetchCount(userId!),
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }

    const cleanupPromise = init();
    return () => {
      cleanupPromise.then((fn) => fn?.());
    };
  }, []);

  async function fetchCount(userId: string) {
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("profissional_id", userId)
      .eq("payment_method", "pix")
      .eq("status", "pending_pix");

    setCount(count || 0);
  }

  if (count === 0) return null;

  return (
    <Link
      href="/profissional/pagamentos-pix"
      className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 transition-all hover:bg-amber-500/15"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500">
        <AlertIcon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-200">
          {count} PIX pendente{count > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-amber-400">
          Clique para validar e liberar créditos
        </p>
      </div>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
        {count}
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

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "R";
  const firstName = userName ? userName.split(" ")[0] : "Profissional";

  const currentPageLabel = useMemo(() => {
    const found = navItems.find((item) =>
      item.href === "/profissional"
        ? pathname === "/profissional"
        : pathname.startsWith(item.href),
    );
    return found?.label || "Painel";
  }, [pathname]);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#F2EDE8]">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ===== SIDEBAR ===== */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1A1614] transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-5 border-b border-white/5">
            <Link href="/profissional" className="group flex items-center">
              <Image
                src="/logo.jpeg"
                alt="Raiza Convento"
                width={140}
                height={42}
                priority
                className="h-9 w-auto opacity-90 transition-opacity group-hover:opacity-100"
                style={{ filter: "brightness(1.15) saturate(0.9)" }}
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white/70 lg:hidden"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Menu
            </p>
            <div className="space-y-0.5">
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
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-[#4A7C59] text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white/85",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-white/35 group-hover:text-white/70",
                      ].join(" ")}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User + Logout */}
          <div className="border-t border-white/5 p-3">
            <div className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4A7C59]/30 text-sm font-bold text-[#6BAF83]">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/80">{firstName}</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-white/35">Online</p>
                </div>
              </div>
            </div>
            <Link
              href="/logout"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/35 transition-all hover:bg-white/5 hover:text-rose-400"
            >
              <LogoutIcon className="h-4 w-4" />
              Sair
            </Link>
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <div className="lg:pl-64">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#D9D0C8]/60 bg-[#F2EDE8]/90 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6B5E55] hover:bg-[#E6DED8] lg:hidden"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div className="lg:hidden">
                <p className="text-sm font-semibold text-[#3D3535]">
                  {currentPageLabel}
                </p>
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#A09080]">
                  Painel Profissional
                </span>
                <span className="text-[#C4B8AE]">/</span>
                <span className="text-xs font-semibold text-[#3D3535]">
                  {currentPageLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link
                href="/profissional/agenda"
                className="hidden items-center gap-2 rounded-xl bg-[#1A1614] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#2A2320] sm:flex"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Agenda
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4A7C59]/15 text-sm font-bold text-[#4A7C59] lg:hidden">
                {userInitial}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            <PendingPixAlert />
            {children}
          </main>

          {/* Footer */}
          <footer className="px-4 py-4 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-1 text-xs text-[#B0A098] sm:flex-row">
              <p>Sigilo e ética profissional em todas as sessões</p>
              <p>© {new Date().getFullYear()} · Raiza Convento - Psicanalista</p>
            </div>
          </footer>
        </div>
      </div>
    </NotificationProvider>
  );
}

// ========== ICONS ==========

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function BlogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
