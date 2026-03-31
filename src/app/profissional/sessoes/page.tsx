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
      if (filterType !== "all" && a.appointment_type !== filterType) return false;
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
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    return { total, scheduled, completed, cancelled };
  }, [appointments]);

  const statusTabs: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "scheduled", label: "Agendadas" },
    { value: "completed", label: "Realizadas" },
    { value: "cancelled", label: "Canceladas" },
  ];

  const typeTabs: { value: FilterType; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "video", label: "Vídeo" },
    { value: "chat", label: "Chat" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Profissional</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">Sessões</h1>
          <p className="mt-1 text-sm text-[#8B7B72]">Histórico e próximas sessões</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)] p-5">
          <p className="text-3xl font-bold text-[#2C2420]">{stats.total}</p>
          <p className="mt-1 text-sm text-[#8B7B72]">Total</p>
        </div>
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)] p-5">
          <p className="text-3xl font-bold text-amber-600">{stats.scheduled}</p>
          <p className="mt-1 text-sm text-[#8B7B72]">Agendadas</p>
        </div>
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)] p-5">
          <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
          <p className="mt-1 text-sm text-[#8B7B72]">Realizadas</p>
        </div>
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)] p-5">
          <p className="text-3xl font-bold text-rose-500">{stats.cancelled}</p>
          <p className="mt-1 text-sm text-[#8B7B72]">Canceladas</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0A098]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por paciente..."
              className="w-full rounded-2xl border border-[#E8E0DC] bg-white pl-10 pr-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
            />
          </div>

          {/* Filter pill tabs */}
          <div className="flex flex-wrap gap-3">
            {/* Status tabs */}
            <div className="flex gap-1 rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    filterStatus === tab.value
                      ? "bg-white text-[#2C2420] shadow-sm"
                      : "text-[#8B7B72] hover:text-[#2C2420]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type tabs */}
            <div className="flex gap-1 rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-1">
              {typeTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterType(tab.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    filterType === tab.value
                      ? "bg-white text-[#2C2420] shadow-sm"
                      : "text-[#8B7B72] hover:text-[#2C2420]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List Card */}
      <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
        <div className="border-b border-[#E8E0DC] px-6 py-4">
          <p className="text-sm font-semibold text-[#2C2420]">Lista de Sessões</p>
          <p className="text-xs text-[#8B7B72]">{filteredAppointments.length} resultado(s)</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#F8F4F1]" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-2xl bg-[#F8F4F1] p-8 text-center">
              <VideoIcon className="mx-auto h-10 w-10 text-[#B0A098]" />
              <p className="mt-4 font-semibold text-[#2C2420]">Nenhuma sessão encontrada</p>
              <p className="mt-1 text-sm text-[#8B7B72]">Ajuste os filtros ou aguarde novos agendamentos.</p>
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
    </div>
  );
}

function SessionRow({ appointment }: { appointment: Appointment }) {
  const startDate = new Date(appointment.start_at);
  const isPast = startDate < new Date();
  const isToday = startDate.toDateString() === new Date().toDateString();

  const statusBadge: Record<string, string> = {
    scheduled: "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700",
    completed: "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700",
    cancelled: "rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700",
    rescheduled: "rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]",
  };

  const statusLabels: Record<string, string> = {
    scheduled: "Agendada",
    completed: "Realizada",
    cancelled: "Cancelada",
    rescheduled: "Reagendada",
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:bg-[#FAFAF8] ${
        isToday ? "border-[#4A7C59]/40 bg-emerald-50/30" : "border-[#E8E0DC]"
      }`}
    >
      {/* Date */}
      <div className="hidden text-center sm:block shrink-0">
        <p className="text-lg font-bold text-[#2C2420]">
          {startDate.toLocaleDateString("pt-BR", { day: "2-digit" })}
        </p>
        <p className="text-xs font-medium uppercase text-[#B0A098]">
          {startDate.toLocaleDateString("pt-BR", { month: "short" })}
        </p>
      </div>

      <div className="hidden h-10 w-px bg-[#E8E0DC] sm:block" />

      {/* Time */}
      <div className="text-center shrink-0">
        <p className="text-lg font-bold text-[#2C2420]">
          {startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-[#B0A098] sm:hidden">
          {startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </p>
      </div>

      <div className="h-10 w-px bg-[#E8E0DC] shrink-0" />

      {/* Patient & Badges */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#2C2420]">
          {appointment.patient?.nome || "Paciente"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              appointment.appointment_type === "video"
                ? "bg-rose-50 text-rose-700"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {appointment.appointment_type === "video" ? "Vídeo" : "Chat"}
          </span>
          <span className={statusBadge[appointment.status] || "rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]"}>
            {statusLabels[appointment.status] || appointment.status}
          </span>
          {isToday && (
            <span className="rounded-full bg-[#4A7C59] px-2.5 py-1 text-xs font-semibold text-white">
              Hoje
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/profissional/sessoes/${appointment.id}`}
        className="shrink-0 rounded-2xl bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d6649]"
      >
        Abrir
      </Link>
    </div>
  );
}

// Icons
function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
