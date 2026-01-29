// src/app/profissional/sessoes/page.tsx
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

type FilterStatus = "all" | "scheduled" | "completed" | "cancelled";
type FilterType = "all" | "video" | "chat";

export default function SessoesPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
          .order("start_at", { ascending: false });

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

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterType !== "all" && a.appointment_type !== filterType)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = a.patient?.nome?.toLowerCase() || "";
        if (!patientName.includes(q)) return false;
      }
      return true;
    });
  }, [appointments, filterStatus, filterType, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter(
      (a) => a.status === "scheduled",
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "completed",
    ).length;
    const cancelled = appointments.filter(
      (a) => a.status === "cancelled",
    ).length;
    return { total, scheduled, completed, cancelled };
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
            <VideoIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900">Sessões</h1>
            <p className="text-sm text-warm-600">
              Histórico completo de atendimentos
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          color="bg-warm-100 text-warm-700"
        />
        <StatCard
          label="Agendadas"
          value={stats.scheduled}
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Realizadas"
          value={stats.completed}
          color="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Canceladas"
          value={stats.cancelled}
          color="bg-rose-100 text-rose-700"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por paciente..."
              className="h-11 w-full rounded-xl border border-warm-200 bg-warm-50 pl-10 pr-4 text-sm text-warm-900 outline-none transition-all focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-1">
              {(
                ["all", "scheduled", "completed", "cancelled"] as FilterStatus[]
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filterStatus === status
                      ? "bg-[#4A7C59] text-white shadow"
                      : "text-warm-600 hover:text-warm-900"
                  }`}
                >
                  {status === "all"
                    ? "Todos"
                    : status === "scheduled"
                      ? "Agendadas"
                      : status === "completed"
                        ? "Realizadas"
                        : "Canceladas"}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-1">
              {(["all", "video", "chat"] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filterType === type
                      ? "bg-[#4A7C59] text-white shadow"
                      : "text-warm-600 hover:text-warm-900"
                  }`}
                >
                  {type === "all"
                    ? "Todos"
                    : type === "video"
                      ? "Vídeo"
                      : "Chat"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-warm-900">Lista de Sessões</p>
            <p className="text-xs text-warm-500">
              {filteredAppointments.length} resultado(s)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-warm-100"
              />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="rounded-xl bg-warm-50 p-8 text-center">
            <VideoIcon className="mx-auto h-12 w-12 text-warm-300" />
            <p className="mt-4 font-semibold text-warm-700">
              Nenhuma sessão encontrada
            </p>
            <p className="mt-1 text-sm text-warm-500">
              Ajuste os filtros ou aguarde novos agendamentos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((appointment) => (
              <SessionRow key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function SessionRow({ appointment }: { appointment: Appointment }) {
  const startDate = new Date(appointment.start_at);
  const isPast = startDate < new Date();
  const isToday = startDate.toDateString() === new Date().toDateString();

  const statusColors: Record<string, string> = {
    scheduled: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    rescheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  const statusLabels: Record<string, string> = {
    scheduled: "Agendada",
    completed: "Realizada",
    cancelled: "Cancelada",
    rescheduled: "Reagendada",
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${isToday ? "border-[#4A7C59] bg-sage-50" : "border-warm-200 bg-warm-50/50"}`}
    >
      {/* Date */}
      <div className="hidden text-center sm:block">
        <p className="text-lg font-bold text-warm-900">
          {startDate.toLocaleDateString("pt-BR", { day: "2-digit" })}
        </p>
        <p className="text-xs font-medium uppercase text-warm-500">
          {startDate.toLocaleDateString("pt-BR", { month: "short" })}
        </p>
      </div>

      <div className="hidden h-10 w-px bg-warm-200 sm:block" />

      {/* Time */}
      <div className="text-center">
        <p className="text-lg font-bold text-warm-900">
          {startDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-xs text-warm-500 sm:hidden">
          {startDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>

      <div className="h-10 w-px bg-warm-200" />

      {/* Patient & Type */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-warm-900">
          {appointment.patient?.nome || "Paciente"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${appointment.appointment_type === "video" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}
          >
            {appointment.appointment_type === "video" ? "Vídeo" : "Chat"}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[appointment.status] || "bg-warm-100 text-warm-700"}`}
          >
            {statusLabels[appointment.status] || appointment.status}
          </span>
          {isToday && (
            <span className="rounded-full bg-[#4A7C59] px-2 py-0.5 text-xs font-semibold text-white">
              Hoje
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/profissional/sessoes/${appointment.id}`}
        className="shrink-0 rounded-xl bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3d6649]"
      >
        Abrir
      </Link>
    </div>
  );
}

// Icons
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

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
