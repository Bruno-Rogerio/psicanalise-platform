"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { isNowWithinSession, fmtDate, fmtTime } from "@/services/session-room";

type AppointmentType = "video" | "chat";
type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

type NextSession = {
  id: string;
  start_at: string;
  end_at: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  profissional_nome: string | null;
};

type RecentRow = {
  id: string;
  start_at: string;
  end_at: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
};

type JoinMaybeArray<T> = T | T[] | null;

function pickJoinOne<T>(value: JoinMaybeArray<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function DashboardClientePage() {
  const [loading, setLoading] = useState(true);
  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const userId = auth.user?.id;
        if (!userId) return;

        // Busca nome do usuário
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", userId)
          .single();
        setUserName(profile?.nome ?? null);

        const nowISO = new Date().toISOString();

        // Próxima sessão
        const { data: nextData, error: nextErr } = await supabase
          .from("appointments")
          .select(
            `
            id,
            start_at,
            end_at,
            appointment_type,
            status,
            profissional:profiles!appointments_profissional_id_fkey(nome)
          `,
          )
          .eq("user_id", userId)
          .neq("status", "cancelled")
          .gte("end_at", nowISO)
          .order("start_at", { ascending: true })
          .limit(1);

        if (nextErr) throw nextErr;

        if (nextData && nextData.length > 0) {
          const row = nextData[0] as any;
          const prof = pickJoinOne(row.profissional);
          setNextSession({
            id: row.id,
            start_at: row.start_at,
            end_at: row.end_at,
            appointment_type: row.appointment_type,
            status: row.status,
            profissional_nome: prof?.nome ?? null,
          });
        } else {
          setNextSession(null);
        }

        // Histórico recente
        const { data: recentData, error: recentErr } = await supabase
          .from("appointments")
          .select("id,start_at,end_at,appointment_type,status")
          .eq("user_id", userId)
          .order("start_at", { ascending: false })
          .limit(3);

        if (recentErr) throw recentErr;
        setRecent((recentData ?? []) as any);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canEnter = useMemo(() => {
    if (!nextSession) return false;
    if (nextSession.status === "cancelled") return false;
    return isNowWithinSession(nextSession.start_at, nextSession.end_at);
  }, [nextSession]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-warm-900 sm:text-3xl">
          {greeting}
          {userName ? `, ${userName.split(" ")[0]}` : ""}.
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Aqui você agenda suas sessões, acompanha a próxima consulta e encontra
          seu histórico. Tudo com clareza, no seu tempo.
        </p>
      </header>

      {/* Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Agendar */}
        <Card className="group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-400/20 to-sage-500/20 transition-transform duration-300 group-hover:scale-105">
            <CalendarPlusIcon className="h-6 w-6 text-sage-600" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Agendamento
            </p>
            <p className="mt-1 text-lg font-semibold text-warm-900">
              Agendar nova sessão
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Escolha um horário, tipo de atendimento e finalize seu
              agendamento.
            </p>
          </div>
          <Link
            href="/agenda"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-500 px-4 py-3 text-sm font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg"
          >
            <CalendarIcon className="h-4 w-4" />
            Ver horários disponíveis
          </Link>
        </Card>

        {/* Próxima sessão */}
        <Card className="group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400/20 to-warm-500/20 transition-transform duration-300 group-hover:scale-105">
            <ClockIcon className="h-6 w-6 text-rose-500" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Próxima sessão
            </p>

            {loading ? (
              <div className="mt-3 space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-lg bg-warm-200" />
                <div className="h-4 w-48 animate-pulse rounded-lg bg-warm-200" />
              </div>
            ) : nextSession ? (
              <>
                <p className="mt-1 text-lg font-semibold text-warm-900">
                  {nextSession.appointment_type === "video" ? "Vídeo" : "Chat"}{" "}
                  • {fmtTime(new Date(nextSession.start_at))}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {fmtDate(new Date(nextSession.start_at))}
                  {nextSession.profissional_nome &&
                    ` • com ${nextSession.profissional_nome}`}
                </p>

                <div className="mt-5 flex flex-col gap-2">
                  {canEnter ? (
                    <Link
                      href={`/sessoes/${nextSession.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-500 px-4 py-3 text-sm font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg"
                    >
                      <PlayIcon className="h-4 w-4" />
                      Entrar agora
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-warm-200 px-4 py-3 text-sm font-medium text-warm-500"
                    >
                      <LockIcon className="h-4 w-4" />
                      Fora do horário
                    </button>
                  )}
                  <Link
                    href="/minhas-sessoes"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-warm-300/60 bg-white/80 px-4 py-3 text-sm font-medium text-warm-700 transition-all duration-300 hover:bg-white hover:shadow-soft"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-lg font-semibold text-warm-900">
                  Nenhuma sessão marcada
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Assim que você agendar, sua próxima sessão aparece aqui.
                </p>
                <div className="mt-4 rounded-xl border border-warm-300/40 bg-warm-200/30 p-3 text-xs text-muted">
                  💡 Dica: você pode cancelar com reembolso até 24h antes.
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Organização */}
        <Card className="group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-soft-400/20 to-soft-500/20 transition-transform duration-300 group-hover:scale-105">
            <ListIcon className="h-6 w-6 text-soft-600" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Organização
            </p>
            <p className="mt-1 text-lg font-semibold text-warm-900">
              Suas consultas
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Histórico por data, tipo de sessão e status (realizada, futura,
              reagendada).
            </p>
          </div>
          <Link
            href="/minhas-sessoes"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-warm-300/60 bg-white/80 px-4 py-3 text-sm font-medium text-warm-700 transition-all duration-300 hover:bg-white hover:shadow-soft"
          >
            <HistoryIcon className="h-4 w-4" />
            Ver histórico
          </Link>
        </Card>
      </section>

      {/* Histórico recente */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-warm-900">
              Histórico recente
            </h2>
            <p className="mt-1 text-sm text-muted">
              Suas últimas sessões aparecem aqui.
            </p>
          </div>
          <Link
            href="/minhas-sessoes"
            className="text-sm font-medium text-sage-600 transition-colors hover:text-sage-700"
          >
            Ver tudo →
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 shadow-soft backdrop-blur-sm">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-warm-200/50"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warm-200/50">
                <CalendarIcon className="h-6 w-6 text-warm-400" />
              </div>
              <p className="mt-3 text-sm text-muted">
                Ainda não há sessões no seu histórico.
              </p>
              <Link
                href="/agenda"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sage-600 hover:text-sage-700"
              >
                Agendar primeira sessão
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-warm-300/30">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/sessoes/${r.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-warm-200/20 sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        r.appointment_type === "video"
                          ? "bg-gradient-to-br from-rose-400/20 to-warm-500/20"
                          : "bg-gradient-to-br from-soft-400/20 to-soft-500/20"
                      }`}
                    >
                      {r.appointment_type === "video" ? (
                        <VideoIcon className="h-5 w-5 text-rose-500" />
                      ) : (
                        <ChatIcon className="h-5 w-5 text-soft-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-warm-900">
                        {fmtDate(new Date(r.start_at))} •{" "}
                        {fmtTime(new Date(r.start_at))}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {r.appointment_type === "video"
                          ? "Videochamada"
                          : "Chat"}{" "}
                        • {statusLabel(r.status)}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-warm-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Card component
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-soft-lg ${className}`}
    >
      {children}
    </div>
  );
}

// Status label
function statusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: "Agendada",
    completed: "Realizada",
    cancelled: "Cancelada",
    rescheduled: "Reagendada",
  };
  return labels[status] ?? status;
}

// Icons
function CalendarPlusIcon({ className }: { className?: string }) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 11v6m-3-3h6"
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

function ListIcon({ className }: { className?: string }) {
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
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
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
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
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}
