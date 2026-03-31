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

  const firstName = userName ? userName.split(" ")[0] : null;

  // Date label e.g. "SEG, 30 MAR"
  const dateLabel = useMemo(() => {
    const now = new Date();
    return now
      .toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      .toUpperCase()
      .replace(/\./g, "");
  }, []);

  return (
    <div className="space-y-6">
      {/* ── 1. Hero greeting card ── */}
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{ background: "#1A1614", minHeight: "160px" }}
      >
        {/* Decorative blurred orbs */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "rgba(232,117,90,0.25)" }}
        />
        <div
          className="pointer-events-none absolute top-4 right-24 h-32 w-32 rounded-full blur-2xl"
          style={{ background: "rgba(74,124,89,0.20)" }}
        />

        <div className="relative z-10 p-8">
          {loading ? (
            <div className="space-y-4">
              <div
                className="h-3 w-24 animate-pulse rounded-full"
                style={{ background: "rgba(255,255,255,0.12)" }}
              />
              <div
                className="h-10 w-64 animate-pulse rounded-2xl"
                style={{ background: "rgba(255,255,255,0.10)" }}
              />
              <div
                className="h-4 w-48 animate-pulse rounded-full"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>
          ) : (
            <>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                {dateLabel}
              </p>
              <h1
                className="mt-2 text-4xl font-black sm:text-5xl"
                style={{ color: "#FFFFFF" }}
              >
                {greeting}
                {firstName ? `, ${firstName}` : ""}!
              </h1>
              <p
                className="mt-2 text-base"
                style={{ color: "rgba(255,255,255,0.50)" }}
              >
                Bem-vinda à sua área de psicanálise.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── 2. Next Session featured card ── */}
      <div
        className="relative overflow-hidden rounded-3xl bg-white shadow-lg"
        style={{ boxShadow: "0 4px 32px rgba(26,22,20,0.08)" }}
      >
        {/* Left colored bar */}
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l-3xl"
          style={{
            background:
              nextSession?.appointment_type === "chat" ? "#5B5EA6" : "#E8755A",
          }}
        />

        <div className="p-6 pl-8">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(26,22,20,0.40)" }}
          >
            Próxima Sessão
          </p>

          {loading ? (
            <div className="mt-3 space-y-3">
              <div
                className="h-6 w-40 animate-pulse rounded-xl"
                style={{ background: "#F2EDE8" }}
              />
              <div
                className="h-4 w-56 animate-pulse rounded-lg"
                style={{ background: "#F2EDE8" }}
              />
              <div
                className="mt-4 h-12 w-full animate-pulse rounded-2xl"
                style={{ background: "#F2EDE8" }}
              />
            </div>
          ) : nextSession ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background:
                      nextSession.appointment_type === "video"
                        ? "rgba(232,117,90,0.12)"
                        : "rgba(91,94,166,0.12)",
                  }}
                >
                  {nextSession.appointment_type === "video" ? (
                    <VideoIcon
                      className="h-5 w-5"
                      style={{
                        color:
                          nextSession.appointment_type === "video"
                            ? "#E8755A"
                            : "#5B5EA6",
                      }}
                    />
                  ) : (
                    <ChatIcon className="h-5 w-5" style={{ color: "#5B5EA6" }} />
                  )}
                </div>
                <div>
                  <p
                    className="text-xl font-bold"
                    style={{ color: "#1A1614" }}
                  >
                    {fmtTime(new Date(nextSession.start_at))}
                    <span
                      className="ml-2 text-sm font-normal"
                      style={{ color: "rgba(26,22,20,0.50)" }}
                    >
                      {nextSession.appointment_type === "video"
                        ? "Vídeo"
                        : "Chat"}
                    </span>
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(26,22,20,0.55)" }}
                  >
                    {fmtDate(new Date(nextSession.start_at))}
                    {nextSession.profissional_nome &&
                      ` • com ${nextSession.profissional_nome}`}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {canEnter ? (
                  <Link
                    href={`/sessoes/${nextSession.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                    style={{ background: "#4A7C59" }}
                  >
                    <PlayIcon className="h-4 w-4" />
                    Entrar agora
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                    style={{
                      background: "#F2EDE8",
                      color: "rgba(26,22,20,0.35)",
                    }}
                  >
                    <LockIcon className="h-4 w-4" />
                    Fora do horário
                  </button>
                )}
                <Link
                  href="/minhas-sessoes"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200 hover:bg-[#F2EDE8]"
                  style={{
                    borderColor: "rgba(26,22,20,0.12)",
                    color: "#1A1614",
                  }}
                >
                  Ver detalhes
                </Link>
              </div>
            </>
          ) : (
            <>
              <p
                className="mt-3 text-lg font-bold"
                style={{ color: "#1A1614" }}
              >
                Nenhuma sessão marcada
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "rgba(26,22,20,0.50)" }}
              >
                Assim que você agendar, sua próxima sessão aparece aqui.
              </p>
              <Link
                href="/agenda"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: "#4A7C59" }}
              >
                <CalendarPlusIcon className="h-4 w-4" />
                Agendar sessão
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── 3. Action cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Agendar */}
        <Link
          href="/agenda"
          className="group flex flex-col rounded-3xl border bg-white p-6 transition-all duration-200 hover:shadow-lg"
          style={{ borderColor: "rgba(26,22,20,0.08)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
            style={{ background: "rgba(232,117,90,0.12)" }}
          >
            <CalendarPlusIcon className="h-6 w-6" style={{ color: "#E8755A" }} />
          </div>
          <p
            className="mt-4 text-base font-bold"
            style={{ color: "#1A1614" }}
          >
            Agendar
          </p>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: "rgba(26,22,20,0.50)" }}
          >
            Escolha um horário e finalize seu agendamento.
          </p>
          <div className="mt-auto pt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: "#E8755A" }}>
            Ver horários
            <ArrowRightIcon className="h-4 w-4" />
          </div>
        </Link>

        {/* Créditos */}
        <Link
          href="/creditos"
          className="group flex flex-col rounded-3xl border bg-white p-6 transition-all duration-200 hover:shadow-lg"
          style={{ borderColor: "rgba(26,22,20,0.08)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
            style={{ background: "rgba(212,167,44,0.12)" }}
          >
            <CreditIcon className="h-6 w-6" style={{ color: "#D4A72C" }} />
          </div>
          <p
            className="mt-4 text-base font-bold"
            style={{ color: "#1A1614" }}
          >
            Créditos
          </p>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: "rgba(26,22,20,0.50)" }}
          >
            Compre pacotes de sessões e gerencie seu saldo.
          </p>
          <div className="mt-auto pt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: "#D4A72C" }}>
            Ver pacotes
            <ArrowRightIcon className="h-4 w-4" />
          </div>
        </Link>

        {/* Histórico */}
        <Link
          href="/minhas-sessoes"
          className="group flex flex-col rounded-3xl border bg-white p-6 transition-all duration-200 hover:shadow-lg"
          style={{ borderColor: "rgba(26,22,20,0.08)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
            style={{ background: "rgba(74,124,89,0.12)" }}
          >
            <HistoryIcon className="h-6 w-6" style={{ color: "#4A7C59" }} />
          </div>
          <p
            className="mt-4 text-base font-bold"
            style={{ color: "#1A1614" }}
          >
            Histórico
          </p>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: "rgba(26,22,20,0.50)" }}
          >
            Veja todas as suas sessões por data e status.
          </p>
          <div className="mt-auto pt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: "#4A7C59" }}>
            Ver histórico
            <ArrowRightIcon className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* ── 4. Recent history ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="text-lg font-bold"
            style={{ color: "#1A1614" }}
          >
            Histórico recente
          </h2>
          <Link
            href="/minhas-sessoes"
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "#4A7C59" }}
          >
            Ver tudo →
          </Link>
        </div>

        <div
          className="overflow-hidden rounded-3xl border bg-white"
          style={{
            borderColor: "rgba(26,22,20,0.08)",
            boxShadow: "0 2px 16px rgba(26,22,20,0.05)",
          }}
        >
          {loading ? (
            <div className="space-y-0 divide-y" style={{ borderColor: "rgba(26,22,20,0.06)" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <div
                    className="h-10 w-10 shrink-0 animate-pulse rounded-2xl"
                    style={{ background: "#F2EDE8" }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-4 w-40 animate-pulse rounded-lg"
                      style={{ background: "#F2EDE8" }}
                    />
                    <div
                      className="h-3 w-28 animate-pulse rounded-lg"
                      style={{ background: "#F2EDE8" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-6 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "#F2EDE8" }}
              >
                <CalendarIcon className="h-7 w-7" style={{ color: "rgba(26,22,20,0.25)" }} />
              </div>
              <p
                className="mt-4 text-sm font-medium"
                style={{ color: "rgba(26,22,20,0.45)" }}
              >
                Ainda não há sessões no seu histórico.
              </p>
              <Link
                href="/agenda"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#4A7C59" }}
              >
                Agendar primeira sessão
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(26,22,20,0.06)" }}>
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/sessoes/${r.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors sm:p-5"
                  style={{ ["--tw-bg-opacity" as string]: "1" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F2EDE8")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        background:
                          r.appointment_type === "video"
                            ? "rgba(232,117,90,0.12)"
                            : "rgba(91,94,166,0.12)",
                      }}
                    >
                      {r.appointment_type === "video" ? (
                        <VideoIcon
                          className="h-5 w-5"
                          style={{ color: "#E8755A" }}
                        />
                      ) : (
                        <ChatIcon
                          className="h-5 w-5"
                          style={{ color: "#5B5EA6" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#1A1614" }}
                      >
                        {fmtDate(new Date(r.start_at))} •{" "}
                        {fmtTime(new Date(r.start_at))}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <p
                          className="text-xs"
                          style={{ color: "rgba(26,22,20,0.45)" }}
                        >
                          {r.appointment_type === "video"
                            ? "Videochamada"
                            : "Chat"}
                        </p>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon
                    className="h-5 w-5 shrink-0"
                    style={{ color: "rgba(26,22,20,0.25)" }}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Status badge
function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config: Record<
    AppointmentStatus,
    { label: string; bg: string; color: string }
  > = {
    scheduled: {
      label: "Agendada",
      bg: "rgba(74,124,89,0.10)",
      color: "#4A7C59",
    },
    completed: {
      label: "Realizada",
      bg: "rgba(91,94,166,0.10)",
      color: "#5B5EA6",
    },
    cancelled: {
      label: "Cancelada",
      bg: "rgba(232,117,90,0.10)",
      color: "#E8755A",
    },
    rescheduled: {
      label: "Reagendada",
      bg: "rgba(212,167,44,0.12)",
      color: "#D4A72C",
    },
  };
  const c = config[status] ?? {
    label: status,
    bg: "#F2EDE8",
    color: "#1A1614",
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

// Status label (kept for compatibility)
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
function CalendarPlusIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 11v6m-3-3h6"
      />
    </svg>
  );
}

function CalendarIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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

function ClockIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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

function PlayIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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

function LockIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function HistoryIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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

function CreditIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function VideoIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChatIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ChevronRightIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function ArrowRightIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}

function ListIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}
