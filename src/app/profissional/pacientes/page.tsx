// src/app/profissional/pacientes/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Patient = {
  id: string;
  nome: string;
  tier: "standard" | "popular";
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
  const { toast } = useToast();
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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [updatingTier, setUpdatingTier] = useState(false);
  const [profissionalId, setProfissionalId] = useState<string | null>(null);

  // Load patients
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) return;
        setProfissionalId(auth.user.id);

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
        const patientIds = [...new Set(raw.map((a: any) => a.user_id).filter(Boolean))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, tier")
          .in("id", patientIds);
        const tierMap: Record<string, "standard" | "popular"> = {};
        for (const p of (profilesData ?? [])) {
          tierMap[p.id] = p.tier ?? "standard";
        }

        const map = new Map<string, Patient>();
        for (const a of raw) {
          const p = Array.isArray(a.patient) ? a.patient[0] : a.patient;
          if (p?.id && !map.has(p.id)) {
            map.set(p.id, { id: p.id, nome: p.nome ?? "Paciente", tier: tierMap[p.id] ?? "standard" });
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

  async function generatePromoCode() {
    if (!profissionalId) return;
    setGeneratingCode(true);
    try {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const code = `POP-${random}`;

      const { error } = await supabase
        .from("promo_codes")
        .insert({ code, profissional_id: profissionalId });

      if (error) throw error;
      setGeneratedCode(code);
      setCodeCopied(false);
    } catch (err: any) {
      toast(err.message || "Erro ao gerar código", "error");
    } finally {
      setGeneratingCode(false);
    }
  }

  async function togglePatientTier(patient: Patient) {
    const newTier = patient.tier === "popular" ? "standard" : "popular";
    if (!confirm(`Alterar ${patient.nome} para plano ${newTier === "popular" ? "Popular" : "Padrão"}?`)) return;

    setUpdatingTier(true);
    try {
      const res = await fetch("/api/profissional/update-patient-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, tier: newTier }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      setPatients((prev) =>
        prev.map((p) => (p.id === patient.id ? { ...p, tier: newTier } : p)),
      );
    } catch (err: any) {
      toast(err.message || "Erro ao atualizar plano", "error");
    } finally {
      setUpdatingTier(false);
    }
  }

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
    <div className="min-h-screen bg-[#F2EDE8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">
              Profissional
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">
              Pacientes
            </h1>
            <p className="mt-1 text-sm text-[#8B7B72]">
              Gerencie seus pacientes e prontuários
            </p>
          </div>

          {/* Promo code generator */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <button
              onClick={generatePromoCode}
              disabled={generatingCode}
              className="flex items-center gap-2 rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#2A2320] disabled:opacity-60"
            >
              <SparkleIcon className="h-4 w-4" />
              {generatingCode ? "Gerando..." : "Gerar código popular"}
            </button>

            {generatedCode && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#E8E0DC]/80 bg-[#1A1614] px-4 py-3 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    Código gerado
                  </p>
                  <p className="font-mono text-base font-bold tracking-widest text-[#D4A72C]">
                    {generatedCode}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedCode);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  }}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  {codeCopied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
              {/* List header */}
              <div className="border-b border-[#E8E0DC] px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#2C2420]">
                    Lista de Pacientes
                  </p>
                  <span className="rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]">
                    {filteredPatients.length}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C4B8AE]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar paciente..."
                    className="w-full rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] py-3 pl-10 pr-4 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:bg-white focus:ring-2 focus:ring-[#4A7C59]/10"
                  />
                </div>

                {/* List */}
                <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
                  {filteredPatients.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#F8F4F1] py-8 text-center">
                      <UsersIcon className="h-8 w-8 text-[#C4B8AE]" />
                      <p className="text-sm font-semibold text-[#8B7B72]">
                        Nenhum paciente encontrado
                      </p>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => {
                      const isActive = patient.id === selectedPatientId;
                      const patientApptCount = appointments.filter(
                        (a) => a.user_id === patient.id,
                      ).length;

                      const initial = patient.nome.charAt(0).toUpperCase();

                      return (
                        <button
                          key={patient.id}
                          onClick={() => setSelectedPatientId(patient.id)}
                          className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                            isActive
                              ? "bg-[#1A1614] shadow-md"
                              : "hover:bg-[#F8F4F1]"
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              isActive
                                ? "bg-white/15 text-white"
                                : "bg-[#4A7C59]/10 text-[#4A7C59]"
                            }`}
                          >
                            {initial}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p
                                className={`truncate text-sm font-bold ${
                                  isActive ? "text-white" : "text-[#2C2420]"
                                }`}
                              >
                                {patient.nome}
                              </p>
                              {patient.tier === "popular" && (
                                <span
                                  className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                                    isActive
                                      ? "border-[#D4A72C]/40 bg-[#D4A72C]/20 text-[#D4A72C]"
                                      : "border-[#D4A72C]/30 bg-[#D4A72C]/10 text-[#D4A72C]"
                                  }`}
                                >
                                  POP
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs ${
                                isActive ? "text-white/50" : "text-[#B0A098]"
                              }`}
                            >
                              {patientApptCount} sessão(ões)
                            </p>
                          </div>

                          {isActive && (
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-white/40" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Patient Detail */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              /* Empty state */
              <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F8F4F1]">
                    <UsersIcon className="h-10 w-10 text-[#C4B8AE]" />
                  </div>
                  <p className="mt-5 text-base font-bold text-[#2C2420]">
                    Selecione um paciente
                  </p>
                  <p className="mt-1.5 max-w-xs text-center text-sm text-[#8B7B72]">
                    Escolha um paciente na lista ao lado para visualizar o histórico de sessões.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Patient Header Card */}
                <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
                  <div className="border-b border-[#E8E0DC] px-6 py-5">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Avatar large */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#4A7C59]/10 text-xl font-bold text-[#4A7C59]">
                        {selectedPatient.nome.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-[#2C2420]">
                          {selectedPatient.nome}
                        </h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {selectedPatient.tier === "popular" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#D4A72C]/30 bg-[#D4A72C]/10 px-2.5 py-1 text-xs font-semibold text-[#D4A72C]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#D4A72C]" />
                              Plano Popular
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#C4B8AE]" />
                              Plano Padrão
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tier toggle */}
                      <button
                        onClick={() => togglePatientTier(selectedPatient)}
                        disabled={updatingTier}
                        className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
                          selectedPatient.tier === "popular"
                            ? "border-[#D4A72C]/30 bg-[#D4A72C]/10 text-[#D4A72C] hover:bg-[#D4A72C]/20"
                            : "border-[#4A7C59]/30 bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20"
                        }`}
                      >
                        {updatingTier
                          ? "Alterando..."
                          : selectedPatient.tier === "popular"
                          ? "Mover para Padrão"
                          : "Mover para Popular"}
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 divide-x divide-[#E8E0DC]">
                    <div className="flex flex-col items-center gap-1 p-5">
                      <p className="text-2xl font-bold text-[#2C2420]">
                        {patientStats.total}
                      </p>
                      <p className="text-xs font-medium text-[#B0A098]">
                        Total
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-5">
                      <p className="text-2xl font-bold text-[#4A7C59]">
                        {patientStats.completed}
                      </p>
                      <p className="text-xs font-medium text-[#4A7C59]/70">
                        Realizadas
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-5">
                      <p className="text-2xl font-bold text-[#D4A72C]">
                        {patientStats.scheduled}
                      </p>
                      <p className="text-xs font-medium text-[#D4A72C]/70">
                        Agendadas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sessions History Card */}
                <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
                  <div className="border-b border-[#E8E0DC] px-6 py-4">
                    <p className="text-sm font-bold text-[#2C2420]">
                      Histórico de Sessões
                    </p>
                    <p className="mt-0.5 text-xs text-[#B0A098]">
                      Com prontuário quando disponível
                    </p>
                  </div>

                  <div className="p-5">
                    {detailLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-24 animate-pulse rounded-3xl bg-[#F5F0ED]"
                          />
                        ))}
                      </div>
                    ) : patientAppointments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F8F4F1]">
                          <CalendarIcon className="h-8 w-8 text-[#C4B8AE]" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#2C2420]">
                          Nenhuma sessão registrada
                        </p>
                        <p className="mt-1 text-xs text-[#8B7B72]">
                          As sessões aparecerão aqui quando forem agendadas
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
              </div>
            )}
          </div>
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
    scheduled: "bg-[#D4A72C]/10 text-[#D4A72C] border border-[#D4A72C]/25",
    completed: "bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/25",
    cancelled: "bg-rose-50 text-rose-700 border border-rose-100",
    rescheduled: "bg-[#F5F0ED] text-[#8B7B72] border border-[#E8E0DC]",
  };

  const statusLabels: Record<string, string> = {
    scheduled: "Agendada",
    completed: "Realizada",
    cancelled: "Cancelada",
    rescheduled: "Reagendada",
  };

  return (
    <div className="rounded-2xl border border-[#E8E0DC] bg-[#FAFAF8] p-4 transition-colors hover:bg-[#F8F4F1]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Date + meta */}
        <div className="flex items-center gap-3">
          {/* Date block */}
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-white border border-[#E8E0DC] shadow-sm">
            <p className="text-sm font-bold leading-tight text-[#2C2420]">
              {startDate.toLocaleDateString("pt-BR", { day: "2-digit" })}
            </p>
            <p className="text-[10px] font-semibold uppercase text-[#B0A098]">
              {startDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#B0A098]">
              {startDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  appointment.appointment_type === "video"
                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                }`}
              >
                {appointment.appointment_type === "video" ? "Vídeo" : "Chat"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  statusColors[appointment.status] ||
                  "bg-[#F5F0ED] text-[#8B7B72]"
                }`}
              >
                {statusLabels[appointment.status] || appointment.status}
              </span>
              {notes && (
                <span className="rounded-full bg-[#4A7C59]/10 px-2 py-0.5 text-xs font-semibold text-[#4A7C59]">
                  Prontuário
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-2xl border border-[#E8E0DC] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2420] transition-all hover:bg-[#F8F4F1]"
            >
              {expanded ? "Ocultar" : "Ver notas"}
            </button>
          )}
          <Link
            href={`/profissional/sessoes/${appointment.id}`}
            className="rounded-2xl bg-[#1A1614] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#2A2320]"
          >
            Abrir
          </Link>
        </div>
      </div>

      {/* Expanded Notes */}
      {expanded && notes && (
        <div className="mt-4 grid gap-3 border-t border-[#E8E0DC] pt-4 sm:grid-cols-2">
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
    <div className="rounded-2xl border border-[#E8E0DC] bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B0A098]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#2C2420]">{value || "—"}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F2EDE8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-24 animate-pulse rounded-3xl bg-[#F5F0ED]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-[520px] animate-pulse rounded-3xl bg-[#F5F0ED]" />
          <div className="h-[520px] animate-pulse rounded-3xl bg-[#F5F0ED] lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}

// Icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
