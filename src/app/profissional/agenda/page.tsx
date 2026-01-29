"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { CalendarMonth } from "@/components/shared/agenda/CalendarMonth";

type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

type Appointment = {
  id: string;
  user_id: string;
  appointment_type: "video" | "chat";
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  patient: { id: string; nome: string } | null;
};

export default function ProfissionalAgendaPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [busy, setBusy] = useState<string | null>(null);

  // Load appointments
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) return;

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

  // Group sessions by day
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const k = new Date(a.start_at).toDateString();
      const prev = map.get(k) ?? [];
      prev.push(a);
      map.set(k, prev);
    }
    return map;
  }, [appointments]);

  // Sessions for selected day
  const selectedSessions = useMemo(() => {
    const k = selectedDay.toDateString();
    const list = sessionsByDay.get(k) ?? [];
    return [...list].sort(
      (a, b) => +new Date(a.start_at) - +new Date(b.start_at),
    );
  }, [selectedDay, sessionsByDay]);

  // Check if day has sessions
  const hasSessions = (d: Date) => {
    return (sessionsByDay.get(d.toDateString())?.length ?? 0) > 0;
  };

  // Stats
  const stats = useMemo(() => {
    const scheduled = selectedSessions.filter(
      (s) => s.status === "scheduled",
    ).length;
    const completed = selectedSessions.filter(
      (s) => s.status === "completed",
    ).length;
    const cancelled = selectedSessions.filter(
      (s) => s.status === "cancelled",
    ).length;
    return { scheduled, completed, cancelled, total: selectedSessions.length };
  }, [selectedSessions]);

  // Update status
  async function updateStatus(id: string, status: AppointmentStatus) {
    try {
      setBusy(id);
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch (e: any) {
      alert(e?.message ?? "Erro ao atualizar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4A7C59] to-[#3d6649] shadow-lg">
            <CalendarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900">Agenda</h1>
            <p className="text-sm text-warm-600">
              Gerencie suas sessões e disponibilidade
            </p>
          </div>
        </div>
        <Link
          href="/profissional/configuracoes"
          className="inline-flex items-center gap-2 rounded-xl border border-warm-300 bg-white px-4 py-2.5 text-sm font-semibold text-warm-700 transition-all hover:bg-warm-50 hover:shadow-sm"
        >
          <SettingsIcon className="h-4 w-4" />
          Configurar disponibilidade
        </Link>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="font-semibold text-warm-900">Calendário</p>
              <p className="text-xs text-warm-500">
                Dias com ponto têm sessões marcadas
              </p>
            </div>
            <CalendarMonth
              month={month}
              onMonthChange={setMonth}
              selected={selectedDay}
              onSelect={setSelectedDay}
              hasAvailability={hasSessions}
            />
          </div>

          {/* Day Stats */}
          <div className="mt-4 rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <p className="font-semibold text-warm-900">
              {selectedDay.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat
                label="Agendadas"
                value={stats.scheduled}
                color="bg-amber-100 text-amber-700"
              />
              <MiniStat
                label="Realizadas"
                value={stats.completed}
                color="bg-emerald-100 text-emerald-700"
              />
              <MiniStat
                label="Canceladas"
                value={stats.cancelled}
                color="bg-rose-100 text-rose-700"
              />
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-warm-900">Sessões do dia</p>
                <p className="text-xs text-warm-500">
                  {stats.total > 0
                    ? `${stats.total} sessão(ões) neste dia`
                    : "Sem sessões agendadas"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${loading ? "bg-warm-100 text-warm-500" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {loading ? "Carregando..." : "Atualizado"}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <SessionsSkeleton />
              ) : selectedSessions.length === 0 ? (
                <EmptyState />
              ) : (
                selectedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    busy={busy === session.id}
                    onComplete={() => updateStatus(session.id, "completed")}
                    onCancel={() => updateStatus(session.id, "cancelled")}
                  />
                ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <p className="font-semibold text-warm-900">Legenda de Status</p>
            <div className="mt-3 flex flex-wrap gap-4">
              <LegendItem color="bg-amber-500" label="Agendada" />
              <LegendItem color="bg-emerald-500" label="Realizada" />
              <LegendItem color="bg-rose-500" label="Cancelada" />
              <LegendItem color="bg-indigo-500" label="Reagendada" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-3 text-center ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function SessionCard({
  session,
  busy,
  onComplete,
  onCancel,
}: {
  session: Appointment;
  busy: boolean;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const startDate = new Date(session.start_at);
  const endDate = new Date(session.end_at);
  const isNow = new Date() >= startDate && new Date() <= endDate;

  const statusColors: Record<AppointmentStatus, string> = {
    scheduled: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    rescheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  const statusLabels: Record<AppointmentStatus, string> = {
    scheduled: "Agendada",
    completed: "Realizada",
    cancelled: "Cancelada",
    rescheduled: "Reagendada",
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${isNow ? "border-[#4A7C59] bg-sage-50 ring-2 ring-[#4A7C59]/20" : "border-warm-200 bg-warm-50/50 hover:shadow-md"}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Time & Patient */}
        <div className="flex items-center gap-4">
          {/* Time */}
          <div className="text-center">
            <p className="text-xl font-bold text-warm-900">
              {startDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-warm-500">
              até{" "}
              {endDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="h-10 w-px bg-warm-200" />

          {/* Patient & Type */}
          <div>
            <p className="font-semibold text-warm-900">
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
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[session.status]}`}
              >
                {statusLabels[session.status]}
              </span>
              {isNow && (
                <span className="flex items-center gap-1 rounded-full bg-[#4A7C59] px-2 py-0.5 text-xs font-semibold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Agora
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {session.status === "scheduled" && (
            <>
              <button
                onClick={onComplete}
                disabled={busy}
                className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50"
              >
                ✓ Realizada
              </button>
              <button
                onClick={onCancel}
                disabled={busy}
                className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-200 disabled:opacity-50"
              >
                ✕ Cancelar
              </button>
            </>
          )}
          <Link
            href={`/profissional/sessoes/${session.id}`}
            className="rounded-lg bg-[#4A7C59] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#3d6649]"
          >
            Abrir
          </Link>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-sm text-warm-700">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-warm-200 bg-warm-50 p-8 text-center">
      <CalendarIcon className="mx-auto h-12 w-12 text-warm-300" />
      <p className="mt-4 font-semibold text-warm-700">
        Nenhuma sessão neste dia
      </p>
      <p className="mt-1 text-sm text-warm-500">
        Selecione outro dia ou configure sua disponibilidade.
      </p>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-warm-200" />
      ))}
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
