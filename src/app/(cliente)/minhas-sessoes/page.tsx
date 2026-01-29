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

type JoinMaybeArray<T> = T | T[] | null;

type RowFromDB = {
  id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  profissional: JoinMaybeArray<{ nome: string | null }>;
};

type Row = {
  id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  profissional_nome: string | null;
};

function pickJoinOne<T>(value: JoinMaybeArray<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function MinhasSessoesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const userId = auth.user?.id;
        if (!userId) throw new Error("Você precisa estar logado.");

        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_type,
            status,
            start_at,
            end_at,
            profissional:profiles!appointments_profissional_id_fkey(nome)
          `,
          )
          .eq("user_id", userId)
          .order("start_at", { ascending: false });

        if (error) throw error;

        const db = (data ?? []) as unknown as RowFromDB[];
        const parsed: Row[] = db.map((r) => {
          const p = pickJoinOne(r.profissional);
          return {
            id: r.id,
            appointment_type: r.appointment_type,
            status: r.status,
            start_at: r.start_at,
            end_at: r.end_at,
            profissional_nome: p?.nome ?? null,
          };
        });

        setRows(parsed);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message ?? "Erro ao carregar sessões.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = useMemo(() => new Date(), []);

  const upcoming = useMemo(
    () =>
      rows
        .filter((r) => new Date(r.end_at) >= now && r.status !== "cancelled")
        .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at)),
    [rows, now],
  );

  const past = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            new Date(r.end_at) < now ||
            r.status === "completed" ||
            r.status === "cancelled",
        )
        .sort((a, b) => +new Date(b.start_at) - +new Date(a.start_at)),
    [rows, now],
  );

  const filteredRows = useMemo(() => {
    if (filter === "upcoming") return upcoming;
    if (filter === "past") return past;
    return rows;
  }, [filter, rows, upcoming, past]);

  // Stats
  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const upcomingCount = upcoming.length;
    return { total, completed, upcoming: upcomingCount };
  }, [rows, upcoming]);

  return (
    <div className="space-y-8">
      {/* Header com stats */}
      <header className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-warm-900 sm:text-3xl">
              Minhas Sessões
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Acompanhe suas sessões passadas e futuras. Você pode entrar na
              sala apenas durante o horário agendado.
            </p>
          </div>

          <Link
            href="/agenda"
            className="inline-flex items-center gap-2 rounded-xl bg-sage-500 px-5 py-3 text-sm font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg"
          >
            <PlusIcon className="h-4 w-4" />
            Agendar nova
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCard
            icon={<CalendarCheckIcon className="h-5 w-5" />}
            label="Total"
            value={stats.total}
            color="warm"
          />
          <StatsCard
            icon={<ClockIcon className="h-5 w-5" />}
            label="Próximas"
            value={stats.upcoming}
            color="sage"
            highlight
          />
          <StatsCard
            icon={<CheckCircleIcon className="h-5 w-5" />}
            label="Realizadas"
            value={stats.completed}
            color="soft"
          />
        </div>
      </header>

      {/* Filtros */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Todas ({rows.length})
        </FilterButton>
        <FilterButton
          active={filter === "upcoming"}
          onClick={() => setFilter("upcoming")}
        >
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
            </span>
            Próximas ({upcoming.length})
          </span>
        </FilterButton>
        <FilterButton
          active={filter === "past"}
          onClick={() => setFilter("past")}
        >
          Histórico ({past.length})
        </FilterButton>
      </div>

      {/* Erro */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 backdrop-blur-sm">
          <AlertIcon className="h-5 w-5 shrink-0 text-rose-500" />
          <p className="text-sm text-rose-700">{errorMsg}</p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-4">
            {filteredRows.map((row, index) => (
              <SessionCard key={row.id} row={row} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Card
function StatsCard({
  icon,
  label,
  value,
  color,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "warm" | "sage" | "soft";
  highlight?: boolean;
}) {
  const colorClasses = {
    warm: "from-rose-400/20 to-warm-500/20 text-rose-600",
    sage: "from-sage-400/20 to-sage-500/20 text-sage-600",
    soft: "from-soft-400/20 to-soft-500/20 text-soft-600",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-warm-300/50 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-soft ${
        highlight ? "ring-2 ring-sage-500/20" : ""
      }`}
    >
      {highlight && (
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sage-400/10 blur-xl" />
      )}
      <div
        className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-warm-900">{value}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  );
}

// Filter Button
function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
        active
          ? "bg-sage-500 text-warm-50 shadow-soft"
          : "bg-white/80 text-warm-600 hover:bg-white hover:text-warm-900 hover:shadow-soft"
      }`}
    >
      {children}
    </button>
  );
}

// Session Card
function SessionCard({ row, index }: { row: Row; index: number }) {
  const start = new Date(row.start_at);
  const end = new Date(row.end_at);
  const canEnter =
    row.status !== "cancelled" && isNowWithinSession(row.start_at, row.end_at);
  const isPast = new Date(row.end_at) < new Date();
  const isToday =
    new Date(row.start_at).toDateString() === new Date().toDateString();

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 p-5 backdrop-blur-sm transition-all duration-500 hover:shadow-soft-lg sm:p-6"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect for active sessions */}
      {canEnter && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-sage-400/5 via-sage-500/10 to-sage-400/5" />
      )}

      {/* Today badge */}
      {isToday && !isPast && (
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-warm-500 px-3 py-1 text-xs font-semibold text-white shadow-soft">
          <SparklesIcon className="h-3 w-3" />
          Hoje
        </div>
      )}

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side */}
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
              row.appointment_type === "video"
                ? "bg-gradient-to-br from-rose-400/20 to-warm-500/20"
                : "bg-gradient-to-br from-soft-400/20 to-soft-500/20"
            }`}
          >
            {row.appointment_type === "video" ? (
              <VideoIcon className="h-6 w-6 text-rose-500" />
            ) : (
              <ChatIcon className="h-6 w-6 text-soft-600" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-warm-900">
                {fmtTime(start)} – {fmtTime(end)}
              </p>
              <StatusBadge status={row.status} />
            </div>

            <p className="mt-1 text-sm text-muted">
              {fmtDate(start)} •{" "}
              {row.appointment_type === "video"
                ? "Videochamada"
                : "Chat por texto"}
            </p>

            {row.profissional_nome && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sage-400/30 to-sage-500/30 text-xs font-medium text-sage-700">
                  {row.profissional_nome.charAt(0)}
                </div>
                <span className="text-sm font-medium text-warm-800">
                  {row.profissional_nome}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          {canEnter ? (
            <Link
              href={`/sessoes/${row.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:brightness-105"
            >
              <PlayIcon className="h-4 w-4" />
              Entrar agora
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            </Link>
          ) : isPast ? (
            <Link
              href={`/sessoes/${row.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-warm-300/60 bg-white/80 px-4 py-2.5 text-sm font-medium text-warm-700 transition-all duration-300 hover:bg-white hover:shadow-soft"
            >
              <EyeIcon className="h-4 w-4" />
              Ver detalhes
            </Link>
          ) : (
            <div className="text-right">
              <CountdownBadge targetDate={start} />
              <p className="mt-1 text-xs text-muted">até a sessão</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = {
    scheduled: {
      label: "Agendada",
      className: "bg-sage-100 text-sage-700 border-sage-200",
    },
    completed: {
      label: "Realizada",
      className: "bg-soft-100 text-soft-700 border-soft-200",
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
    rescheduled: {
      label: "Reagendada",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

// Countdown Badge
function CountdownBadge({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Agora!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}min`);
      } else {
        setTimeLeft(`${minutes}min`);
      }
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sage-100 to-soft-100 px-3 py-1.5 text-sm font-semibold text-sage-700">
      <ClockIcon className="h-4 w-4" />
      {timeLeft}
    </span>
  );
}

// Skeleton
function SessionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-warm-300/50 bg-white/80 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-warm-200" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-32 rounded-lg bg-warm-200" />
          <div className="h-4 w-48 rounded-lg bg-warm-200" />
          <div className="h-4 w-24 rounded-lg bg-warm-200" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-warm-200" />
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ filter }: { filter: "all" | "upcoming" | "past" }) {
  const messages = {
    all: {
      title: "Nenhuma sessão ainda",
      description:
        "Agende sua primeira sessão e comece sua jornada de autoconhecimento.",
      cta: true,
    },
    upcoming: {
      title: "Sem sessões agendadas",
      description: "Você não tem sessões futuras. Que tal agendar uma?",
      cta: true,
    },
    past: {
      title: "Sem histórico",
      description: "Suas sessões realizadas aparecerão aqui.",
      cta: false,
    },
  };

  const { title, description, cta } = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-warm-300/50 bg-white/80 py-16 backdrop-blur-sm">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-warm-200/50 to-warm-300/50">
        <CalendarIcon className="h-10 w-10 text-warm-400" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-warm-900">{title}</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-muted">
        {description}
      </p>
      {cta && (
        <Link
          href="/agenda"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sage-500 px-6 py-3 text-sm font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg"
        >
          <PlusIcon className="h-4 w-4" />
          Agendar sessão
        </Link>
      )}
    </div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4v16m8-8H4"
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

function CalendarCheckIcon({ className }: { className?: string }) {
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
        strokeWidth={2}
        d="M9 14l2 2 4-4"
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

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
        strokeWidth={2}
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

function EyeIcon({ className }: { className?: string }) {
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
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
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
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
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
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
