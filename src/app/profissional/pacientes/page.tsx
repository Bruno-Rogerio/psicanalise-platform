"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";
type AppointmentType = "video" | "chat";

type Patient = {
  id: string;
  nome: string;
};

// ✅ Supabase costuma tipar joins como ARRAY
type AppointmentRowRaw = {
  id: string;
  user_id: string;
  profissional_id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  patient?: { id: string; nome: string | null }[]; // <- array
};

// ✅ Tipo normalizado para usar no app
type AppointmentRow = Omit<AppointmentRowRaw, "patient"> & {
  patient: { id: string; nome: string | null } | null; // <- objeto
};

type SessionNotes = {
  appointment_id: string;
  profissional_id: string;
  user_id: string;
  queixa: string | null;
  associacoes: string | null;
  intervencoes: string | null;
  plano: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(s: AppointmentStatus) {
  if (s === "scheduled") return "Agendada";
  if (s === "completed") return "Realizada";
  if (s === "cancelled") return "Cancelada";
  if (s === "rescheduled") return "Reagendada";
  return s;
}

function typeLabel(t: AppointmentType) {
  return t === "video" ? "Vídeo" : "Chat";
}

function showOrDash(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t.length ? t : "—";
}

export default function ProfissionalPacientesPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [allAppointments, setAllAppointments] = useState<AppointmentRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<
    AppointmentRow[]
  >([]);
  const [notesByAppointment, setNotesByAppointment] = useState<
    Record<string, SessionNotes>
  >({});

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.nome.toLowerCase().includes(q));
  }, [patients, query]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) ?? null;
  }, [patients, selectedPatientId]);

  // 1) Carrega todos os appointments do profissional + join do paciente (profiles)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        if (!auth.user?.id) throw new Error("Você precisa estar logado.");

        const profissionalId = auth.user.id;

        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            user_id,
            profissional_id,
            appointment_type,
            status,
            start_at,
            end_at,
            patient:profiles!appointments_user_id_fkey ( id, nome )
          `,
          )
          .eq("profissional_id", profissionalId)
          .order("start_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(error.message);
        }

        const raw = (data ?? []) as AppointmentRowRaw[];

        // ✅ normaliza patient array -> objeto
        const rows: AppointmentRow[] = raw.map((a) => ({
          ...a,
          patient: a.patient?.[0] ?? null,
        }));

        setAllAppointments(rows);

        // pacientes únicos
        const map = new Map<string, Patient>();
        for (const a of rows) {
          const p = a.patient;
          if (!p?.id) continue;
          if (!map.has(p.id)) {
            map.set(p.id, { id: p.id, nome: (p.nome ?? "—").trim() || "—" });
          }
        }

        const uniquePatients = Array.from(map.values()).sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        );

        setPatients(uniquePatients);

        if (uniquePatients.length && !selectedPatientId) {
          setSelectedPatientId(uniquePatients[0].id);
        }
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? "Erro ao carregar pacientes.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Quando seleciona paciente: pega as sessões dele + prontuário (session_notes)
  useEffect(() => {
    (async () => {
      if (!selectedPatientId) return;

      setDetailLoading(true);
      setDetailErr(null);
      setPatientAppointments([]);
      setNotesByAppointment({});

      try {
        const appts = allAppointments.filter(
          (a) => a.user_id === selectedPatientId,
        );
        setPatientAppointments(appts);

        const ids = appts.map((a) => a.id);
        if (!ids.length) {
          setDetailLoading(false);
          return;
        }

        const { data: notesData, error: notesErr } = await supabase
          .from("session_notes")
          .select(
            "appointment_id, profissional_id, user_id, queixa, associacoes, intervencoes, plano, observacoes, created_at, updated_at",
          )
          .in("appointment_id", ids);

        if (notesErr) throw notesErr;

        const map: Record<string, SessionNotes> = {};
        for (const n of (notesData ?? []) as SessionNotes[]) {
          map[n.appointment_id] = n;
        }
        setNotesByAppointment(map);
      } catch (e: any) {
        console.error(e);
        setDetailErr(e?.message ?? "Erro ao carregar histórico.");
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedPatientId, allAppointments]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-xl border border-[#D6DED9] bg-white/70" />
        <div className="h-36 animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70" />
        <div className="h-64 animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 text-sm text-[#5F6B64]">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
              Pacientes
            </h1>
            <p className="mt-1 text-sm text-[#5F6B64]">
              Selecione um paciente para ver sessões e prontuários.
            </p>
          </div>

          <Link
            href="/profissional/agenda"
            className="rounded-xl border border-[#D6DED9] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-white/80"
          >
            Voltar para agenda
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lista de pacientes */}
        <section className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111111]">Lista</p>
            <span className="text-xs font-semibold text-[#5F6B64]">
              {patients.length} total
            </span>
          </div>

          <div className="mt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar paciente…"
              className="h-11 w-full rounded-xl border border-[#D6DED9] bg-white px-3 text-sm text-[#111111] outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="mt-3 max-h-[520px] overflow-auto rounded-2xl border border-[#D6DED9] bg-white/70 p-2">
            {filteredPatients.length === 0 ? (
              <div className="rounded-xl border border-[#D6DED9] bg-white p-3 text-sm text-[#5F6B64]">
                Nenhum paciente encontrado.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPatients.map((p) => {
                  const active = p.id === selectedPatientId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                        active
                          ? "bg-[#111111] text-white"
                          : "bg-white text-[#111111] hover:bg-white/80"
                      }`}
                    >
                      {p.nome}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Detalhe do paciente */}
        <section className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111111]">
                {selectedPatient
                  ? selectedPatient.nome
                  : "Selecione um paciente"}
              </p>
              <p className="mt-1 text-xs text-[#5F6B64]">
                Histórico de sessões (com prontuário quando existir).
              </p>
            </div>
          </div>

          {detailErr ? (
            <div className="mt-4 rounded-xl border border-[#D6DED9] bg-white p-3 text-sm text-[#5F6B64]">
              {detailErr}
            </div>
          ) : null}

          <div className="mt-4">
            {detailLoading ? (
              <div className="space-y-2">
                <div className="h-16 animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70" />
                <div className="h-16 animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70" />
                <div className="h-16 animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70" />
              </div>
            ) : patientAppointments.length === 0 ? (
              <div className="rounded-xl border border-[#D6DED9] bg-white p-3 text-sm text-[#5F6B64]">
                Esse paciente ainda não tem sessões.
              </div>
            ) : (
              <div className="space-y-3">
                {patientAppointments.map((a) => {
                  const notes = notesByAppointment[a.id] ?? null;

                  return (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-[#D6DED9] bg-white/70 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#111111]">
                            {fmtDateTime(a.start_at)} •{" "}
                            {typeLabel(a.appointment_type)}
                          </p>
                          <p className="mt-1 text-xs text-[#5F6B64]">
                            Status: {statusLabel(a.status)}
                          </p>
                        </div>

                        <Link
                          href={`/profissional/sessoes/${a.id}`}
                          className="inline-flex items-center justify-center rounded-xl bg-[#111111] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                        >
                          Abrir sessão
                        </Link>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Field
                          label="Queixa"
                          value={showOrDash(notes?.queixa)}
                        />
                        <Field
                          label="Associações"
                          value={showOrDash(notes?.associacoes)}
                        />
                        <Field
                          label="Intervenções"
                          value={showOrDash(notes?.intervencoes)}
                        />
                        <Field label="Plano" value={showOrDash(notes?.plano)} />
                      </div>

                      <div className="mt-3">
                        <Field
                          label="Observações"
                          value={showOrDash(notes?.observacoes)}
                          full
                        />
                      </div>

                      {!notes ? (
                        <p className="mt-3 text-xs text-[#5F6B64]">
                          Sem prontuário salvo para essa sessão.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#D6DED9] bg-white p-3">
      <p className="text-xs font-semibold text-[#111111]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[#111111]">{value}</p>
    </div>
  );
}
