"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { PendingPixAlert } from "./layout";

type Appointment = {
  id: string;
  user_id: string;
  appointment_type: "video" | "chat";
  status: string;
  start_at: string;
  end_at: string;
  patient: { id: string; nome: string } | null;
};

export default function ProfissionalDashboard() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", auth.user.id)
          .single();
        setUserName(profile?.nome ?? null);

        const { data, error } = await supabase
          .from("appointments")
          .select(
            `id, user_id, appointment_type, status, start_at, end_at,
             patient:profiles!appointments_user_id_fkey ( id, nome )`,
          )
          .eq("profissional_id", auth.user.id)
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true });

        if (!error && data) {
          setAppointments(
            data.map((a: any) => ({ ...a, patient: a.patient?.[0] ?? null })),
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const todaySessions = appointments.filter((a) => {
      const d = new Date(a.start_at);
      return d >= today && d < tomorrow && a.status === "scheduled";
    });
    const weekSessions = appointments.filter((a) => {
      const d = new Date(a.start_at);
      return d >= today && d < weekEnd && a.status === "scheduled";
    });
    const uniquePatients = new Set(appointments.map((a) => a.user_id)).size;

    return { today: todaySessions.length, week: weekSessions.length, patients: uniquePatients };
  }, [appointments]);

  const nextSessions = useMemo(
    () => appointments.filter((a) => a.status === "scheduled").slice(0, 6),
    [appointments],
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const firstName = userName ? userName.split(" ")[0] : "Profissional";

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <PendingPixAlert />

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#1A1614] px-8 py-8 sm:px-10 sm:py-10">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#4A7C59]/20" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-48 w-48 rounded-full bg-[#4A7C59]/10" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/40">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-2 text-base text-white/50">
              {stats.today > 0
                ? `Você tem ${stats.today} sessão${stats.today > 1 ? "ões" : ""} hoje.`
                : "Nenhuma sessão hoje. Bom descanso!"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/profissional/agenda"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#4A7C59] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3d6649] sm:px-5 sm:py-3"
            >
              <CalendarIcon className="h-4 w-4" />
              Abrir Agenda
            </Link>
            <Link
              href="/profissional/pacientes"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white sm:px-5 sm:py-3"
            >
              <UsersIcon className="h-4 w-4" />
              Pacientes
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Hoje"
          value={stats.today}
          sublabel="sessões"
          accent="#E8755A"
          accentBg="#FDF0EC"
        />
        <StatCard
          label="Esta semana"
          value={stats.week}
          sublabel="próximos 7 dias"
          accent="#D4A72C"
          accentBg="#FDF8EC"
        />
        <StatCard
          label="Pacientes"
          value={stats.patients}
          sublabel="ativos"
          accent="#4A7C59"
          accentBg="#EFF5F1"
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Sessions */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-[#D9D0C8]/70 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8E0DC] px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-[#3D3535]">
                  Próximas Sessões
                </h2>
                <p className="text-xs text-[#A09080]">Agendadas a partir de agora</p>
              </div>
              <Link
                href="/profissional/agenda"
                className="flex items-center gap-1 text-xs font-semibold text-[#4A7C59] hover:underline"
              >
                Ver agenda
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#F0EAE6]">
              {nextSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F0ED]">
                    <CalendarIcon className="h-8 w-8 text-[#C4B8AE]" />
                  </div>
                  <p className="mt-4 font-semibold text-[#8B7B72]">
                    Nenhuma sessão agendada
                  </p>
                  <p className="mt-1 text-sm text-[#B0A098]">
                    Seus próximos compromissos aparecerão aqui.
                  </p>
                </div>
              ) : (
                nextSessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="rounded-3xl border border-[#D9D0C8]/70 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-[#3D3535]">
              Acesso Rápido
            </h2>
            <div className="space-y-2">
              <QuickAction
                href="/profissional/financeiro"
                icon={<WalletIcon className="h-4 w-4" />}
                label="Financeiro"
                description="Pagamentos e relatórios"
                color="#4A7C59"
              />
              <QuickAction
                href="/profissional/configuracoes"
                icon={<SettingsIcon className="h-4 w-4" />}
                label="Configurações"
                description="Disponibilidade e perfil"
                color="#7B6EA8"
              />
              <QuickAction
                href="/profissional/produtos"
                icon={<PackageIcon className="h-4 w-4" />}
                label="Produtos"
                description="Pacotes de sessões"
                color="#D4A72C"
              />
              <QuickAction
                href="/profissional/link-pagamento"
                icon={<LinkIcon className="h-4 w-4" />}
                label="Link de Pagamento"
                description="Cobranças avulsas"
                color="#E8755A"
              />
            </div>
          </div>

          {/* Insight card */}
          <div className="overflow-hidden rounded-3xl bg-[#1A1614]">
            <div className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                Dica
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Mantenha as anotações de sessão atualizadas — elas são a base do acompanhamento de cada paciente.
              </p>
            </div>
            <div className="border-t border-white/5 px-5 py-3">
              <Link
                href="/profissional/sessoes"
                className="text-xs font-semibold text-[#6BAF83] hover:underline"
              >
                Ver sessões recentes →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTS ──

function StatCard({
  label,
  value,
  sublabel,
  accent,
  accentBg,
}: {
  label: string;
  value: number;
  sublabel: string;
  accent: string;
  accentBg: string;
}) {
  return (
    <div className="rounded-3xl border border-[#D9D0C8]/70 bg-white p-3 shadow-sm sm:p-5">
      <div
        className="mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold sm:mb-3 sm:px-2.5 sm:py-1 sm:text-xs"
        style={{ backgroundColor: accentBg, color: accent }}
      >
        {label}
      </div>
      <p
        className="text-3xl font-bold tracking-tight sm:text-5xl"
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-[#A09080] sm:mt-1 sm:text-xs">{sublabel}</p>
    </div>
  );
}

function SessionRow({ session }: { session: Appointment }) {
  const start = new Date(session.start_at);
  const isToday = new Date().toDateString() === start.toDateString();

  return (
    <div className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[#FAFAF8]">
      {/* Date block */}
      <div className="w-14 shrink-0 text-center">
        <p className="text-lg font-bold leading-none text-[#3D3535]">
          {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="mt-1 text-[10px] font-medium uppercase text-[#B0A098]">
          {isToday
            ? "hoje"
            : start.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </p>
      </div>

      {/* Divider */}
      <div className="h-8 w-px shrink-0 bg-[#E8E0DC]" />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#3D3535]">
          {session.patient?.nome || "Paciente"}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {isToday && (
            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              Hoje
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              session.appointment_type === "video"
                ? "bg-rose-50 text-rose-600"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            {session.appointment_type === "video" ? "Vídeo" : "Chat"}
          </span>
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/profissional/sessoes/${session.id}`}
        className="shrink-0 rounded-xl border border-[#D9D0C8] bg-white px-3 py-1.5 text-xs font-semibold text-[#3D3535] transition-all hover:border-[#4A7C59] hover:bg-[#4A7C59] hover:text-white"
      >
        Abrir
      </Link>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  description,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-[#EBE5E0] p-3 transition-all hover:border-[#D9D0C8] hover:shadow-sm"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#3D3535]">{label}</p>
        <p className="truncate text-xs text-[#A09080]">{description}</p>
      </div>
      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-[#C4B8AE] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8B7B72]" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-[#D9D0C8]" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-[#D9D0C8]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-3xl bg-[#D9D0C8] lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-3xl bg-[#D9D0C8]" />
      </div>
    </div>
  );
}

// ── ICONS ──

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
