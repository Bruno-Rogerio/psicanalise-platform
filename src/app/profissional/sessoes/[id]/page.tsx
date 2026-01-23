"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getSessionRoomById,
  isNowWithinSession,
  SessionRoom,
  fmtDate,
  fmtTime,
} from "@/services/session-room";
import { getNotes, upsertNotes } from "@/services/session-notes";
import {
  listChatMessages,
  sendChatMessage,
  ChatMessage,
  SenderRole,
} from "@/services/session-chat";

type NotesForm = {
  queixa: string;
  associacoes: string;
  intervencoes: string;
  plano: string;
  observacoes: string;
};

const EMPTY_NOTES: NotesForm = {
  queixa: "",
  associacoes: "",
  intervencoes: "",
  plano: "",
  observacoes: "",
};

export default function ProfissionalSessaoPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [room, setRoom] = useState<SessionRoom | null>(null);
  const [notes, setNotes] = useState<NotesForm>(EMPTY_NOTES);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const saveTimer = useRef<number | null>(null);

  const senderRole: SenderRole | null = useMemo(() => {
    if (!room) return null;
    return "profissional";
  }, [room]);

  const canChat = useMemo(() => {
    if (!room) return false;
    if (room.appointment_type !== "chat") return false;
    return isNowWithinSession(room.start_at, room.end_at);
  }, [room]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const r = await getSessionRoomById(appointmentId);
        setRoom(r);

        const [n, m] = await Promise.all([
          getNotes(appointmentId),
          listChatMessages(appointmentId),
        ]);

        if (n) {
          setNotes({
            queixa: n.queixa ?? "",
            associacoes: n.associacoes ?? "",
            intervencoes: n.intervencoes ?? "",
            plano: n.plano ?? "",
            observacoes: n.observacoes ?? "",
          });
        }

        setMessages(m);
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId]);

  // polling leve do chat (simples e estável)
  useEffect(() => {
    if (!room) return;
    const interval = window.setInterval(async () => {
      try {
        const m = await listChatMessages(appointmentId);
        setMessages(m);
      } catch {
        // ignore
      }
    }, 3500);
    return () => window.clearInterval(interval);
  }, [appointmentId, room]);

  function setField<K extends keyof NotesForm>(key: K, value: string) {
    setNotes((prev) => ({ ...prev, [key]: value }));

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveNotes();
    }, 900);
  }

  async function saveNotes() {
    if (!room) return;

    setSaving(true);
    try {
      await upsertNotes({
        appointment_id: room.id,
        profissional_id: room.profissional_id,
        user_id: room.user_id,

        queixa: notes.queixa || null,
        associacoes: notes.associacoes || null,
        intervencoes: notes.intervencoes || null,
        plano: notes.plano || null,
        observacoes: notes.observacoes || null,
      });
    } finally {
      setSaving(false);
    }
  }

  async function onSend() {
    if (!room || !senderRole) return;

    const text = msg.trim();
    if (!text) return;

    setChatBusy(true);
    try {
      await sendChatMessage({
        appointmentId: room.id,
        senderRole,
        message: text,
      });

      setMsg("");
      const m = await listChatMessages(room.id);
      setMessages(m);
    } catch (e: any) {
      alert(e?.message ?? "Erro ao enviar mensagem.");
    } finally {
      setChatBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-xl border border-[#D6DED9] bg-white/70" />
        <div className="h-36 animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70" />
        <div className="h-64 animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 text-sm text-[#5F6B64]">
        Sessão não encontrada.
      </div>
    );
  }

  const start = new Date(room.start_at);
  const end = new Date(room.end_at);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
              Sessão
            </h1>
            <p className="mt-1 text-sm text-[#5F6B64]">
              {fmtDate(start)} • {fmtTime(start)}–{fmtTime(end)} •{" "}
              {room.appointment_type === "video" ? "Vídeo" : "Chat"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profissional/agenda"
              className="rounded-xl border border-[#D6DED9] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-white/80"
            >
              Voltar
            </Link>

            <button
              onClick={saveNotes}
              className="rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Salvar agora
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
          <div className="grid gap-2 sm:grid-cols-3">
            <InfoItem
              label="Paciente"
              value={room.patient?.nome ?? "Paciente"}
            />
            <InfoItem label="Status" value={statusLabel(room.status)} />
            <InfoItem label="ID" value={room.id} mono />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[#5F6B64]">
              Auto-save ativo. {saving ? "Salvando…" : "Tudo salvo."}
            </p>

            {room.appointment_type === "chat" ? (
              <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
                Chat {canChat ? "liberado" : "bloqueado (fora do horário)"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
                Vídeo (Daily vem depois)
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* PRONTUÁRIO */}
        <section className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111111]">Prontuário</p>
            <p className="text-xs text-[#5F6B64]">Blocos sempre abertos</p>
          </div>

          <div className="mt-4 grid gap-3">
            <TextareaBlock
              label="Queixa / demanda"
              value={notes.queixa}
              onChange={(v) => setField("queixa", v)}
              placeholder="Queixa principal, contexto, motivo da busca…"
            />
            <TextareaBlock
              label="Associações / falas marcantes"
              value={notes.associacoes}
              onChange={(v) => setField("associacoes", v)}
              placeholder="Temas recorrentes, afetos, repetições…"
            />
            <TextareaBlock
              label="Intervenções / hipóteses"
              value={notes.intervencoes}
              onChange={(v) => setField("intervencoes", v)}
              placeholder="Pontuações, manejo, hipóteses clínicas…"
            />
            <TextareaBlock
              label="Plano / próximos passos"
              value={notes.plano}
              onChange={(v) => setField("plano", v)}
              placeholder="Foco da próxima sessão, combinados…"
            />
            <TextareaBlock
              label="Observações"
              value={notes.observacoes}
              onChange={(v) => setField("observacoes", v)}
              placeholder="Livre…"
              rows={5}
            />
          </div>
        </section>

        {/* CHAT */}
        <section className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111111]">Chat</p>
            <p className="text-xs text-[#5F6B64]">
              {room.appointment_type === "chat"
                ? "Durante a sessão"
                : "Somente histórico"}
            </p>
          </div>

          <div className="mt-4 flex h-[540px] flex-col overflow-hidden rounded-2xl border border-[#D6DED9] bg-white/70">
            <div className="flex-1 space-y-2 overflow-auto p-3">
              {messages.length === 0 ? (
                <div className="rounded-xl border border-[#D6DED9] bg-white p-3 text-sm text-[#5F6B64]">
                  Sem mensagens ainda.
                </div>
              ) : (
                messages.map((m) => (
                  <ChatBubble
                    key={m.id}
                    mine={m.sender_role === "profissional"}
                    body={m.message}
                    at={m.created_at}
                  />
                ))
              )}
            </div>

            <div className="border-t border-[#D6DED9] p-3">
              {room.appointment_type !== "chat" ? (
                <div className="text-xs text-[#5F6B64]">
                  Essa sessão é de vídeo. O chat pode ficar como registro se
                  necessário.
                </div>
              ) : !canChat ? (
                <div className="text-xs text-[#5F6B64]">
                  Chat indisponível fora do horário da sessão.
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Escreva uma mensagem…"
                    className="h-11 w-full rounded-xl border border-[#D6DED9] bg-white px-3 text-sm text-[#111111] outline-none focus:ring-2 focus:ring-black/10"
                  />
                  <button
                    disabled={chatBusy || !msg.trim()}
                    onClick={onSend}
                    className="h-11 rounded-xl bg-[#111111] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#D6DED9] bg-white/70 p-3">
      <p className="text-xs font-semibold text-[#111111]">{label}</p>
      <p
        className={`mt-1 text-sm text-[#111111] ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function TextareaBlock({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold text-[#111111]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-sm text-[#111111] outline-none focus:ring-2 focus:ring-black/10"
      />
    </label>
  );
}

function ChatBubble({
  mine,
  body,
  at,
}: {
  mine: boolean;
  body: string;
  at: string;
}) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl border border-[#D6DED9] px-3 py-2 text-sm ${
          mine ? "bg-[#111111] text-white" : "bg-white text-[#111111]"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        <p
          className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-[#5F6B64]"}`}
        >
          {fmtTime(new Date(at))}
        </p>
      </div>
    </div>
  );
}

function statusLabel(s: string) {
  if (s === "scheduled") return "Agendada";
  if (s === "completed") return "Realizada";
  if (s === "cancelled") return "Cancelada";
  if (s === "rescheduled") return "Reagendada";
  return s;
}
