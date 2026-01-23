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
import { getNotes } from "@/services/session-notes";
import {
  listChatMessages,
  sendChatMessage,
  ChatMessage,
  SenderRole,
} from "@/services/session-chat";

type NotesReadOnly = {
  queixa: string;
  associacoes: string;
  intervencoes: string;
  plano: string;
  observacoes: string;
};

const EMPTY_NOTES: NotesReadOnly = {
  queixa: "",
  associacoes: "",
  intervencoes: "",
  plano: "",
  observacoes: "",
};

export default function ClienteSessaoPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params.id;

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<SessionRoom | null>(null);

  const [notes, setNotes] = useState<NotesReadOnly>(EMPTY_NOTES);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const senderRole: SenderRole | null = useMemo(() => {
    if (!room) return null;
    return "cliente";
  }, [room]);

  const canChat = useMemo(() => {
    if (!room) return false;
    if (room.appointment_type !== "chat") return false;
    return isNowWithinSession(room.start_at, room.end_at);
  }, [room]);

  const pollRef = useRef<number | null>(null);

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

        // cliente não edita prontuário: só leitura (se quiser mostrar algo)
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

  useEffect(() => {
    if (!room) return;

    pollRef.current = window.setInterval(async () => {
      try {
        const m = await listChatMessages(appointmentId);
        setMessages(m);
      } catch {
        // ignore
      }
    }, 3500);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [appointmentId, room]);

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
              Sua sessão
            </h1>
            <p className="mt-1 text-sm text-[#5F6B64]">
              {fmtDate(start)} • {fmtTime(start)}–{fmtTime(end)} •{" "}
              {room.appointment_type === "video" ? "Vídeo" : "Chat"}
            </p>
          </div>

          <Link
            href="/agenda"
            className="rounded-xl border border-[#D6DED9] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-white/80"
          >
            Voltar
          </Link>
        </div>

        <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoItem
              label="Profissional"
              value={room.professional?.nome ?? "Profissional"}
            />
            <InfoItem label="Status" value={statusLabel(room.status)} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            {room.appointment_type === "chat" ? (
              <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
                Chat {canChat ? "liberado" : "bloqueado (fora do horário)"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
                Vídeo (em breve)
              </span>
            )}

            <p className="text-xs text-[#5F6B64]">
              Sigilo e ética em todas as sessões.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* painel de orientação (sem prontuário) */}
        <section className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
          <p className="text-sm font-semibold text-[#111111]">Orientações</p>
          <div className="mt-3 space-y-2 text-sm text-[#5F6B64]">
            <p>
              Se for chat, ele só fica disponível durante o horário da sessão.
            </p>
            <p>
              Cancelamento com reembolso até 24h antes. Menos que isso, apenas
              reagendamento.
            </p>
          </div>

          {/* Se você quiser, pode mostrar um “resumo” sem expor prontuário:
              por enquanto deixei pronto, mas escondido.
              Remova o "hidden" quando quiser mostrar algo. */}
          <div className="hidden mt-5 rounded-xl border border-[#D6DED9] bg-white/70 p-3">
            <p className="text-xs font-semibold text-[#111111]">
              Notas (somente leitura)
            </p>
            <p className="mt-2 text-xs text-[#5F6B64] whitespace-pre-wrap">
              {notes.observacoes || "—"}
            </p>
          </div>
        </section>

        {/* chat */}
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
                    mine={m.sender_role === "cliente"}
                    body={m.message}
                    at={m.created_at}
                  />
                ))
              )}
            </div>

            <div className="border-t border-[#D6DED9] p-3">
              {room.appointment_type !== "chat" ? (
                <div className="text-xs text-[#5F6B64]">
                  Essa sessão é de vídeo. O chat pode ficar como registro, se
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#D6DED9] bg-white/70 p-3">
      <p className="text-xs font-semibold text-[#111111]">{label}</p>
      <p className="mt-1 text-sm text-[#111111]">{value}</p>
    </div>
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
