"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

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

        // Get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", auth.user.id)
          .single();
        setUserName(profile?.nome ?? null);

        // Get appointments
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            user_id,
            appointment_type,
            status,
            start_at,
            end_at,
            patient:profiles!appointments_user_id_fkey ( id, nome )
          `,
          )
          .eq("profissional_id", auth.user.id)
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true });

        if (!error && data) {
          const normalized = data.map((a: any) => ({
            ...a,
            patient: a.patient?.[0] ?? null,
          }));
          setAppointments(normalized);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Stats
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

    return {
      today: todaySessions.length,
      week: weekSessions.length,
      patients: uniquePatients,
    };
  }, [appointments]);

  // Next sessions (max 5)
  const nextSessions = useMemo(() => {
    return appointments.filter((a) => a.status === "scheduled").slice(0, 5);
  }, [appointments]);

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const firstName = userName ? userName.split(" ")[0] : "Profissional";

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <header className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-900 sm:text-3xl">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="mt-1 text-warm-600">
              Aqui está o resumo do seu dia e próximas sessões.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/profissional/agenda"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4A7C59] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#3d6649] hover:shadow-lg"
            >
              <CalendarIcon className="h-4 w-4" />
              Abrir Agenda
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<TodayIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-rose-400 to-rose-500"
          label="Sessões Hoje"
          value={stats.today}
          sublabel={stats.today === 1 ? "sessão agendada" : "sessões agendadas"}
          highlight={stats.today > 0}
        />
        <StatCard
          icon={<WeekIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-amber-400 to-amber-500"
          label="Esta Semana"
          value={stats.week}
          sublabel="próximos 7 dias"
        />
        <StatCard
          icon={<UsersIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-indigo-400 to-indigo-500"
          label="Pacientes Ativos"
          value={stats.patients}
          sublabel="com sessões agendadas"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Sessions */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-warm-900">
                  Próximas Sessões
                </h2>
                <p className="text-sm text-warm-500">Suas sessões agendadas</p>
              </div>
              <Link
                href="/profissional/agenda"
                className="text-sm font-medium text-[#4A7C59] hover:underline"
              >
                Ver todas →
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {nextSessions.length === 0 ? (
                <div className="rounded-xl border border-warm-200 bg-warm-50 p-6 text-center">
                  <CalendarIcon className="mx-auto h-10 w-10 text-warm-300" />
                  <p className="mt-3 text-sm font-medium text-warm-700">
                    Nenhuma sessão agendada
                  </p>
                  <p className="mt-1 text-xs text-warm-500">
                    Seus próximos compromissos aparecerão aqui.
                  </p>
                </div>
              ) : (
                nextSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-warm-900">Acesso Rápido</h2>
            <p className="text-sm text-warm-500">Atalhos para ações comuns</p>

            <div className="mt-5 space-y-2">
              <QuickAction
                href="/profissional/pacientes"
                icon={<UsersIcon className="h-5 w-5" />}
                label="Ver Pacientes"
                description="Lista e prontuários"
              />
              <QuickAction
                href="/profissional/configuracoes"
                icon={<SettingsIcon className="h-5 w-5" />}
                label="Configurações"
                description="Disponibilidade e perfil"
              />
              <QuickAction
                href="/profissional/financeiro"
                icon={<WalletIcon className="h-5 w-5" />}
                label="Financeiro"
                description="Pagamentos e relatórios"
              />
            </div>
          </div>

          {/* Tips Card */}
          <div className="rounded-2xl border border-sage-200 bg-gradient-to-br from-sage-50 to-soft-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <LightbulbIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-warm-900">Dica do dia</p>
                <p className="mt-1 text-sm text-warm-600">
                  Mantenha suas anotações de sessão atualizadas para um
                  acompanhamento mais eficiente dos pacientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function StatCard({
  icon,
  iconBg,
  label,
  value,
  sublabel,
  highlight,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-sm transition-all ${highlight ? "border-rose-200 ring-2 ring-rose-100" : "border-warm-200"}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} text-white shadow-md`}
        >
          {icon}
        </div>
        {highlight && (
          <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
            Hoje
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-warm-900">{value}</p>
        <p className="text-sm font-medium text-warm-700">{label}</p>
        <p className="text-xs text-warm-500">{sublabel}</p>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: Appointment }) {
  const startDate = new Date(session.start_at);
  const isToday = new Date().toDateString() === startDate.toDateString();

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${isToday ? "border-rose-200 bg-rose-50/50" : "border-warm-200 bg-warm-50/50"}`}
    >
      {/* Time */}
      <div className="text-center">
        <p className="text-2xl font-bold text-warm-900">
          {startDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-xs font-medium text-warm-500">
          {startDate.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>

      {/* Divider */}
      <div className="h-12 w-px bg-warm-200" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-semibold text-warm-900">
          {session.patient?.nome || "Paciente"}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${session.appointment_type === "video" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}
          >
            {session.appointment_type === "video" ? (
              <VideoIcon className="h-3 w-3" />
            ) : (
              <ChatIcon className="h-3 w-3" />
            )}
            {session.appointment_type === "video" ? "Vídeo" : "Chat"}
          </span>
          {isToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">
              Hoje
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/profissional/sessoes/${session.id}`}
        className="shrink-0 rounded-xl bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3d6649]"
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
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-warm-200 bg-warm-50/50 p-3 transition-all hover:border-sage-300 hover:bg-sage-50 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-warm-600 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-warm-900">{label}</p>
        <p className="text-xs text-warm-500">{description}</p>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-32 animate-pulse rounded-2xl bg-warm-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-36 animate-pulse rounded-2xl bg-warm-200" />
        <div className="h-36 animate-pulse rounded-2xl bg-warm-200" />
        <div className="h-36 animate-pulse rounded-2xl bg-warm-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-warm-200 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-warm-200" />
      </div>
    </div>
  );
}

// Icons
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
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function TodayIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function WeekIcon({ className }: { className?: string }) {
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
        strokeWidth={2}
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
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
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
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
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
        strokeWidth={2}
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
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
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
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}
