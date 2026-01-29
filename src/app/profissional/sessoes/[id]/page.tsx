// src/app/profissional/sessoes/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type SessionRoom = {
  id: string;
  appointment_type: "video" | "chat";
  status: string;
  start_at: string;
  end_at: string;
  patient: { id: string; nome: string; email?: string } | null;
  professional: { id: string; nome: string } | null;
};

type SessionNotes = {
  queixa: string;
  associacoes: string;
  intervencoes: string;
  plano: string;
  observacoes: string;
};

export default function SessaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<SessionRoom | null>(null);
  const [notes, setNotes] = useState<SessionNotes>({
    queixa: "",
    associacoes: "",
    intervencoes: "",
    plano: "",
    observacoes: "",
  });
  const [notesBusy, setNotesBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  // Load session
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_type,
            status,
            start_at,
            end_at,
            patient:profiles!appointments_user_id_fkey ( id, nome, email ),
            professional:profiles!appointments_profissional_id_fkey ( id, nome )
          `,
          )
          .eq("id", sessionId)
          .single();

        if (error) throw error;

        const normalized = {
          ...data,
          patient: data.patient?.[0] ?? null,
          professional: data.professional?.[0] ?? null,
        };
        setRoom(normalized);

        // Load notes
        const { data: notesData } = await supabase
          .from("session_notes")
          .select("queixa, associacoes, intervencoes, plano, observacoes")
          .eq("appointment_id", sessionId)
          .single();

        if (notesData) {
          setNotes({
            queixa: notesData.queixa || "",
            associacoes: notesData.associacoes || "",
            intervencoes: notesData.intervencoes || "",
            plano: notesData.plano || "",
            observacoes: notesData.observacoes || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // Save notes
  async function saveNotes() {
    if (!room) return;

    try {
      setNotesBusy(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) throw new Error("Não autenticado");

      const { error } = await supabase.from("session_notes").upsert({
        appointment_id: sessionId,
        profissional_id: auth.user.id,
        user_id: room.patient?.id,
        ...notes,
      });

      if (error) throw error;
      alert("Prontuário salvo ✓");
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar");
    } finally {
      setNotesBusy(false);
    }
  }

  // Update status
  async function updateStatus(status: string) {
    if (!room) return;

    try {
      setStatusBusy(true);

      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", sessionId);

      if (error) throw error;

      setRoom({ ...room, status });
    } catch (e: any) {
      alert(e?.message ?? "Erro ao atualizar");
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (!room) {
    return (
      <div className="rounded-2xl border border-warm-200 bg-white p-8 text-center shadow-sm">
        <p className="font-semibold text-warm-700">Sessão não encontrada</p>
        <Link
          href="/profissional/sessoes"
          className="mt-4 inline-block text-sm text-[#4A7C59] hover:underline"
        >
          ← Voltar para sessões
        </Link>
      </div>
    );
  }

  const startDate = new Date(room.start_at);
  const endDate = new Date(room.end_at);
  const now = new Date();
  const isActive = now >= startDate && now <= endDate;
  const canStart =
    now >= new Date(startDate.getTime() - 10 * 60 * 1000) && now <= endDate;

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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${room.appointment_type === "video" ? "bg-gradient-to-br from-rose-500 to-rose-600" : "bg-gradient-to-br from-indigo-500 to-indigo-600"}`}
          >
            {room.appointment_type === "video" ? (
              <VideoIcon className="h-7 w-7 text-white" />
            ) : (
              <ChatIcon className="h-7 w-7 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900">
              Sessão de {room.appointment_type === "video" ? "Vídeo" : "Chat"}
            </h1>
            <p className="text-sm text-warm-600">
              {startDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <Link
          href="/profissional/sessoes"
          className="inline-flex items-center gap-2 rounded-xl border border-warm-300 bg-white px-4 py-2.5 text-sm font-semibold text-warm-700 transition-all hover:bg-warm-50"
        >
          ← Voltar
        </Link>
      </header>

      {/* Session Info */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Paciente" value={room.patient?.nome || "—"} />
          <InfoCard
            label="Horário"
            value={`${startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
          />
          <InfoCard
            label="Tipo"
            value={
              room.appointment_type === "video"
                ? "Videochamada"
                : "Chat por texto"
            }
          />
          <div className="rounded-xl bg-warm-50 p-4">
            <p className="text-xs font-semibold text-warm-500">Status</p>
            <span
              className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusColors[room.status] || "bg-warm-100 text-warm-700"}`}
            >
              {statusLabels[room.status] || room.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-warm-200 pt-5">
          {room.status === "scheduled" && (
            <>
              {canStart && (
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#4A7C59] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#3d6649]">
                  {room.appointment_type === "video" ? (
                    <VideoIcon className="h-4 w-4" />
                  ) : (
                    <ChatIcon className="h-4 w-4" />
                  )}
                  {room.appointment_type === "video"
                    ? "Iniciar Vídeo"
                    : "Abrir Chat"}
                </button>
              )}
              <button
                onClick={() => updateStatus("completed")}
                disabled={statusBusy}
                className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-200 disabled:opacity-50"
              >
                ✓ Marcar como Realizada
              </button>
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={statusBusy}
                className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-200 disabled:opacity-50"
              >
                ✕ Cancelar Sessão
              </button>
            </>
          )}

          {!canStart && room.status === "scheduled" && (
            <p className="text-sm text-warm-500">
              Sessão disponível a partir de 10 min antes do horário.
            </p>
          )}

          {isActive && (
            <span className="flex items-center gap-2 rounded-full bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Sessão em andamento
            </span>
          )}
        </div>
      </div>

      {/* Notes / Prontuário */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-warm-900">Prontuário</h2>
            <p className="text-sm text-warm-500">
              Anotações da sessão (visíveis apenas para você)
            </p>
          </div>
          <button
            onClick={saveNotes}
            disabled={notesBusy}
            className="rounded-xl bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3d6649] disabled:opacity-50"
          >
            {notesBusy ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <NoteField
            label="Queixa"
            placeholder="O que o paciente trouxe na sessão..."
            value={notes.queixa}
            onChange={(v) => setNotes({ ...notes, queixa: v })}
          />
          <NoteField
            label="Associações"
            placeholder="Associações livres, memórias..."
            value={notes.associacoes}
            onChange={(v) => setNotes({ ...notes, associacoes: v })}
          />
          <NoteField
            label="Intervenções"
            placeholder="Intervenções realizadas..."
            value={notes.intervencoes}
            onChange={(v) => setNotes({ ...notes, intervencoes: v })}
          />
          <NoteField
            label="Plano"
            placeholder="Plano para próximas sessões..."
            value={notes.plano}
            onChange={(v) => setNotes({ ...notes, plano: v })}
          />
          <div className="sm:col-span-2">
            <NoteField
              label="Observações"
              placeholder="Outras observações relevantes..."
              value={notes.observacoes}
              onChange={(v) => setNotes({ ...notes, observacoes: v })}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-warm-50 p-4">
      <p className="text-xs font-semibold text-warm-500">{label}</p>
      <p className="mt-1 font-semibold text-warm-900">{value}</p>
    </div>
  );
}

function NoteField({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-warm-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-warm-200 bg-warm-50 p-3 text-sm text-warm-900 outline-none transition-all focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-warm-200" />
      <div className="h-40 animate-pulse rounded-2xl bg-warm-200" />
      <div className="h-80 animate-pulse rounded-2xl bg-warm-200" />
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
