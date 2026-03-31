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
      {/* Header */}
      <header className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#1A1614]">
              Minhas Sessões
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#1A1614]/50">
              Acompanhe suas sessões passadas e futuras. Você pode entrar na
              sala apenas durante o horário agendado.
            </p>
          </div>

          <Link
            href="/agenda"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4A7C59] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#3d6649] hover:shadow-md"
          >
            <PlusIcon className="h-4 w-4" />
            Agendar nova
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total */}
          <div className="rounded-2xl bg-white border border-[#1A1614]/10 p-4">
            <p className="text-3xl font-black text-[#1A1614]">{stats.total}</p>
            <p className="mt-1 text-xs text-[#1A1614]/40 uppercase tracking-wide font-medium">Total</p>
          </div>
          {/* Upcoming */}
          <div className="rounded-2xl bg-white border border-[#1A1614]/10 p-4">
            <p className="text-3xl font-black text-[#4A7C59]">{stats.upcoming}</p>
            <p className="mt-1 text-xs text-[#1A1614]/40 uppercase tracking-wide font-medium">Próximas</p>
          </div>
          {/* Completed */}
          <div className="rounded-2xl bg-white border border-[#1A1614]/10 p-4">
            <p className="text-3xl font-black text-[#D4A72C]">{stats.completed}</p>
            <p className="mt-1 text-xs text-[#1A1614]/40 uppercase tracking-wide font-medium">Realizadas</p>
          </div>
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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A7C59] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4A7C59]" />
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
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
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
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-[#1A1614] text-white shadow-sm"
          : "bg-white text-[#1A1614]/70 border border-[#1A1614]/10 hover:bg-white hover:text-[#1A1614]"
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

  const isVideo = row.appointment_type === "video";

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-white border p-5 transition-all duration-300 hover:shadow-md sm:p-6 ${
        canEnter
          ? "border-[#4A7C59]/40 shadow-[0_0_0_2px_rgba(74,124,89,0.2)]"
          : "border-[#1A1614]/10"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-6 bottom-6 w-1 rounded-full ${
          isVideo ? "bg-[#E8755A]" : "bg-[#5B5EA6]"
        }`}
      />

      {/* Active session glow */}
      {canEnter && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#4A7C59]/5 via-[#4A7C59]/10 to-[#4A7C59]/5 pointer-events-none" />
      )}

      {/* Today badge */}
      {isToday && !isPast && (
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-[#E8755A] px-3 py-1 text-xs font-semibold text-white">
          <SparklesIcon className="h-3 w-3" />
          Hoje
        </div>
      )}

      <div className="relative flex flex-col gap-5 pl-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side */}
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
              isVideo
                ? "bg-[#E8755A]/15"
                : "bg-[#5B5EA6]/15"
            }`}
          >
            {isVideo ? (
              <VideoIcon className="h-5 w-5 text-[#E8755A]" />
            ) : (
              <ChatIcon className="h-5 w-5 text-[#5B5EA6]" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-bold text-[#1A1614]">
                {fmtTime(start)} – {fmtTime(end)}
              </p>
              <StatusBadge status={row.status} />
            </div>

            <p className="mt-1 text-sm text-[#1A1614]/50">
              {fmtDate(start)} •{" "}
              {isVideo ? "Videochamada" : "Chat por texto"}
            </p>

            {row.profissional_nome && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4A7C59]/20 text-xs font-semibold text-[#4A7C59]">
                  {row.profissional_nome.charAt(0)}
                </div>
                <span className="text-sm font-medium text-[#1A1614]/70">
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#4A7C59] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#3d6649] hover:shadow-md"
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
              className="inline-flex items-center gap-2 rounded-xl border border-[#1A1614]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#1A1614]/70 transition-all duration-200 hover:bg-[#F2EDE8] hover:text-[#1A1614]"
            >
              <EyeIcon className="h-4 w-4" />
              Ver detalhes
            </Link>
          ) : (
            <div className="text-right">
              <CountdownBadge targetDate={start} />
              <p className="mt-1 text-xs text-[#1A1614]/40">até a sessão</p>
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
      className: "bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20",
    },
    completed: {
      label: "Realizada",
      className: "bg-[#D4A72C]/10 text-[#D4A72C] border-[#D4A72C]/20",
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
    rescheduled: {
      label: "Reagendada",
      className: "bg-[#5B5EA6]/10 text-[#5B5EA6] border-[#5B5EA6]/20",
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
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#4A7C59]/10 border border-[#4A7C59]/20 px-3 py-1.5 text-sm font-semibold text-[#4A7C59]">
      <ClockIcon className="h-4 w-4" />
      {timeLeft}
    </span>
  );
}

// Skeleton
function SessionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-[#1A1614]/10 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4 pl-4">
        <div className="h-12 w-12 rounded-2xl bg-[#1A1614]/8" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-36 rounded-lg bg-[#1A1614]/8" />
          <div className="h-4 w-52 rounded-lg bg-[#1A1614]/6" />
          <div className="h-4 w-28 rounded-lg bg-[#1A1614]/6" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-[#1A1614]/8" />
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
    <div className="flex flex-col items-center justify-center rounded-3xl border border-[#1A1614]/10 bg-white py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F2EDE8]">
        <CalendarIcon className="h-9 w-9 text-[#1A1614]/30" />
      </div>
      <h3 className="mt-6 text-xl font-black text-[#1A1614]">{title}</h3>
      <p className="mt-2 max-w-xs text-center text-sm text-[#1A1614]/50">
        {description}
      </p>
      {cta && (
        <Link
          href="/agenda"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#4A7C59] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#3d6649] hover:shadow-md"
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
