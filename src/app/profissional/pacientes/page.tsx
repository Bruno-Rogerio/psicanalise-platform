// src/app/profissional/pacientes/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Patient = {
  id: string;
  nome: string;
};

type Appointment = {
  id: string;
  user_id: string;
  appointment_type: "video" | "chat";
  status: string;
  start_at: string;
  end_at: string;
};

type SessionNotes = {
  appointment_id: string;
  queixa: string | null;
  associacoes: string | null;
  intervencoes: string | null;
  plano: string | null;
  observacoes: string | null;
};

export default function PacientesPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notesByAppointment, setNotesByAppointment] = useState<
    Record<string, SessionNotes>
  >({});
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  // Load patients
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
        console.log("DEBUG Pacientes:", { userId: auth.user.id, data, error });

        if (error) throw error;

        const raw = (data ?? []) as any[];
        const appts: Appointment[] = raw.map((a) => ({
          id: a.id,
          user_id: a.user_id,
          appointment_type: a.appointment_type,
          status: a.status,
          start_at: a.start_at,
          end_at: a.end_at,
        }));
        setAppointments(appts);

        // Unique patients
        const map = new Map<string, Patient>();
        for (const a of raw) {
          const p = a.patient?.[0];
          if (p?.id && !map.has(p.id)) {
            map.set(p.id, { id: p.id, nome: p.nome ?? "Paciente" });
          }
        }
        const uniquePatients = Array.from(map.values()).sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        );
        setPatients(uniquePatients);

        if (uniquePatients.length > 0) {
          setSelectedPatientId(uniquePatients[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load notes when patient changes
  useEffect(() => {
    if (!selectedPatientId) return;

    (async () => {
      setDetailLoading(true);
      const patientAppts = appointments.filter(
        (a) => a.user_id === selectedPatientId,
      );
      const ids = patientAppts.map((a) => a.id);

      if (ids.length === 0) {
        setNotesByAppointment({});
        setDetailLoading(false);
        return;
      }

      const { data } = await supabase
        .from("session_notes")
        .select(
          "appointment_id, queixa, associacoes, intervencoes, plano, observacoes",
        )
        .in("appointment_id", ids);

      const map: Record<string, SessionNotes> = {};
      for (const n of (data ?? []) as SessionNotes[]) {
        map[n.appointment_id] = n;
      }
      setNotesByAppointment(map);
      setDetailLoading(false);
    })();
  }, [selectedPatientId, appointments]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => p.nome.toLowerCase().includes(q));
  }, [patients, searchQuery]);

  // Selected patient data
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) ?? null;
  }, [patients, selectedPatientId]);

  const patientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];
    return appointments
      .filter((a) => a.user_id === selectedPatientId)
      .sort((a, b) => +new Date(b.start_at) - +new Date(a.start_at));
  }, [appointments, selectedPatientId]);

  // Stats
  const patientStats = useMemo(() => {
    const total = patientAppointments.length;
    const completed = patientAppointments.filter(
      (a) => a.status === "completed",
    ).length;
    const scheduled = patientAppointments.filter(
      (a) => a.status === "scheduled",
    ).length;
    return { total, completed, scheduled };
  }, [patientAppointments]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
            <UsersIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900">Pacientes</h1>
            <p className="text-sm text-warm-600">
              {patients.length} paciente(s) com sessões
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patients List */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="font-semibold text-warm-900">Lista de Pacientes</p>
              <p className="text-xs text-warm-500">
                {filteredPatients.length} encontrado(s)
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar paciente..."
                className="h-11 w-full rounded-xl border border-warm-200 bg-warm-50 pl-10 pr-4 text-sm text-warm-900 outline-none transition-all focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>

            {/* List */}
            <div className="max-h-[500px] space-y-1 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="rounded-xl bg-warm-50 p-4 text-center text-sm text-warm-500">
                  Nenhum paciente encontrado
                </div>
              ) : (
                filteredPatients.map((patient) => {
                  const isActive = patient.id === selectedPatientId;
                  const patientApptCount = appointments.filter(
                    (a) => a.user_id === patient.id,
                  ).length;

                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                        isActive
                          ? "bg-[#4A7C59] text-white shadow-md"
                          : "bg-warm-50 text-warm-900 hover:bg-warm-100"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-sage-100 text-sage-700"
                        }`}
                      >
                        {patient.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{patient.nome}</p>
                        <p
                          className={`text-xs ${isActive ? "text-white/70" : "text-warm-500"}`}
                        >
                          {patientApptCount} sessão(ões)
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Patient Detail */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <div className="rounded-2xl border border-warm-200 bg-white p-8 text-center shadow-sm">
              <UsersIcon className="mx-auto h-12 w-12 text-warm-300" />
              <p className="mt-4 font-semibold text-warm-700">
                Selecione um paciente
              </p>
              <p className="mt-1 text-sm text-warm-500">
                Escolha um paciente na lista para ver o histórico.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patient Header */}
              <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sage-100 to-sage-200 text-xl font-bold text-sage-700">
                      {selectedPatient.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-warm-900">
                        {selectedPatient.nome}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-warm-50 p-3 text-center">
                    <p className="text-2xl font-bold text-warm-900">
                      {patientStats.total}
                    </p>
                    <p className="text-xs text-warm-500">Total</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">
                      {patientStats.completed}
                    </p>
                    <p className="text-xs text-emerald-600">Realizadas</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">
                      {patientStats.scheduled}
                    </p>
                    <p className="text-xs text-amber-600">Agendadas</p>
                  </div>
                </div>
              </div>

              {/* Sessions History */}
              <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="font-semibold text-warm-900">
                    Histórico de Sessões
                  </p>
                  <p className="text-xs text-warm-500">
                    Com prontuário quando disponível
                  </p>
                </div>

                {detailLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-32 animate-pulse rounded-xl bg-warm-100"
                      />
                    ))}
                  </div>
                ) : patientAppointments.length === 0 ? (
                  <div className="rounded-xl bg-warm-50 p-6 text-center">
                    <p className="text-sm text-warm-500">
                      Nenhuma sessão registrada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientAppointments.map((appt) => {
                      const notes = notesByAppointment[appt.id];
                      return (
                        <SessionHistoryCard
                          key={appt.id}
                          appointment={appt}
                          notes={notes}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionHistoryCard({
  appointment,
  notes,
}: {
  appointment: Appointment;
  notes?: SessionNotes;
}) {
  const [expanded, setExpanded] = useState(false);
  const startDate = new Date(appointment.start_at);

  const statusColors: Record<string, string> = {
    scheduled: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    rescheduled: "bg-indigo-100 text-indigo-700",
  };

  const statusLabels: Record<string, string> = {
    scheduled: "Agendada",
    completed: "Realizada",
    cancelled: "Cancelada",
    rescheduled: "Reagendada",
  };

  return (
    <div className="rounded-xl border border-warm-200 bg-warm-50/50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-warm-900">
              {startDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </p>
            <p className="text-xs text-warm-500">
              {startDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="h-10 w-px bg-warm-200" />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${appointment.appointment_type === "video" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}
              >
                {appointment.appointment_type === "video" ? "Vídeo" : "Chat"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[appointment.status] || "bg-warm-100 text-warm-700"}`}
              >
                {statusLabels[appointment.status] || appointment.status}
              </span>
            </div>
            {notes && (
              <p className="mt-1 text-xs text-warm-500">
                Prontuário disponível
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg bg-warm-100 px-3 py-1.5 text-xs font-medium text-warm-700 hover:bg-warm-200"
            >
              {expanded ? "Ocultar" : "Ver notas"}
            </button>
          )}
          <Link
            href={`/profissional/sessoes/${appointment.id}`}
            className="rounded-lg bg-[#4A7C59] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3d6649]"
          >
            Abrir
          </Link>
        </div>
      </div>

      {/* Expanded Notes */}
      {expanded && notes && (
        <div className="mt-4 grid gap-3 border-t border-warm-200 pt-4 sm:grid-cols-2">
          <NoteField label="Queixa" value={notes.queixa} />
          <NoteField label="Associações" value={notes.associacoes} />
          <NoteField label="Intervenções" value={notes.intervencoes} />
          <NoteField label="Plano" value={notes.plano} />
          <div className="sm:col-span-2">
            <NoteField label="Observações" value={notes.observacoes} />
          </div>
        </div>
      )}
    </div>
  );
}

function NoteField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-semibold text-warm-500">{label}</p>
      <p className="mt-1 text-sm text-warm-900">{value || "—"}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-warm-200" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-96 animate-pulse rounded-2xl bg-warm-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-warm-200 lg:col-span-2" />
      </div>
    </div>
  );
}

// Icons
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
