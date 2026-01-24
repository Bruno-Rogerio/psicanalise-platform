"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getSessionRoomById,
  isNowWithinSessionWithMargin,
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

// Ajustes de tolerância
const ENTER_EARLY_MIN = 10; // libera 10 min antes
const VIDEO_END_GRACE_MIN = 0; // tolerância após o fim (0 = acabou, derruba)

function isNowAllowedForVideo(startISO: string, endISO: string) {
  // libera 10 min antes e derruba ao passar do fim + grace
  const now = Date.now();
  const start = new Date(startISO).getTime() - ENTER_EARLY_MIN * 60 * 1000;
  const end = new Date(endISO).getTime() + VIDEO_END_GRACE_MIN * 60 * 1000;
  return now >= start && now <= end;
}

export default function ClienteSessaoPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params.id;

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<SessionRoom | null>(null);

  const [notes, setNotes] = useState<NotesReadOnly>(EMPTY_NOTES);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  // Daily (vídeo dentro da página)
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [dailyUrl, setDailyUrl] = useState<string | null>(null);

  const senderRole: SenderRole | null = useMemo(() => {
    if (!room) return null;
    return "cliente";
  }, [room]);

  const canEnterSession = useMemo(() => {
    if (!room) return false;
    if (room.status !== "scheduled" && room.status !== "rescheduled")
      return false;
    return isNowWithinSessionWithMargin(
      room.start_at,
      room.end_at,
      ENTER_EARLY_MIN,
    );
  }, [room]);

  const canChat = useMemo(() => {
    if (!room) return false;
    if (room.appointment_type !== "chat") return false;
    if (!canEnterSession) return false;
    return true;
  }, [room, canEnterSession]);

  const canVideo = useMemo(() => {
    if (!room) return false;
    if (room.appointment_type !== "video") return false;
    if (room.status === "cancelled") return false;
    return isNowAllowedForVideo(room.start_at, room.end_at);
  }, [room]);

  const pollRef = useRef<number | null>(null);
  const videoWatchRef = useRef<number | null>(null);

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
        } else {
          setNotes(EMPTY_NOTES);
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

  // ✅ Auto-encerrar vídeo quando sair da janela permitida
  useEffect(() => {
    if (!room) return;
    if (room.appointment_type !== "video") return;

    // limpa watcher anterior
    if (videoWatchRef.current) window.clearInterval(videoWatchRef.current);

    videoWatchRef.current = window.setInterval(() => {
      const allowed = isNowAllowedForVideo(room.start_at, room.end_at);
      if (!allowed && dailyUrl) {
        setDailyUrl(null);
        setJoinError("Sessão encerrada. O horário do atendimento terminou.");
      }
    }, 15000);

    return () => {
      if (videoWatchRef.current) window.clearInterval(videoWatchRef.current);
    };
  }, [room, dailyUrl]);

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

  async function onJoinSession() {
    if (!room) return;
    if (room.status === "cancelled") return;
    if (!canEnterSession) return;

    setJoinError(null);

    // chat: só rola pro chat
    if (room.appointment_type === "chat") {
      const el = document.getElementById("chat");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // vídeo: abre dentro da página
    if (!canVideo) {
      setJoinError("Vídeo indisponível fora do horário da sessão.");
      return;
    }

    setJoinBusy(true);
    try {
      const resp = await fetch("/api/daily/ensure-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: room.id }),
      });

      const json = await resp.json().catch(() => ({}) as any);

      if (!resp.ok) {
        console.error("ensure-room failed", { status: resp.status, json });
        throw new Error(json?.error || "Falha ao abrir sala de vídeo.");
      }

      const url: string | undefined = json?.url;
      const token: string | undefined = json?.token;

      if (!url) throw new Error("Resposta inválida do servidor (sem url).");
      if (!token) throw new Error("Resposta inválida do servidor (sem token).");

      const u = new URL(url);
      u.searchParams.set("t", token);

      setDailyUrl(u.toString());

      // rola para o player
      setTimeout(() => {
        const el = document.getElementById("video");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (e: any) {
      console.error(e);
      setJoinError(e?.message ?? "Erro ao entrar na sessão de vídeo.");
    } finally {
      setJoinBusy(false);
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

  const joinLabel =
    room.appointment_type === "video"
      ? "Entrar na sessão (vídeo)"
      : "Entrar na sessão (chat)";

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
            href="/minhas-sessoes"
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

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
                {room.appointment_type === "video" ? "Vídeo" : "Chat"}
              </span>

              {room.status === "cancelled" ? (
                <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5F6B64]">
                  Sessão cancelada
                </span>
              ) : canEnterSession ? (
                <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
                  Acesso liberado
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5F6B64]">
                  Bloqueado (fora do horário)
                </span>
              )}
            </div>

            <p className="text-xs text-[#5F6B64]">
              Sigilo e ética em todas as sessões.
            </p>
          </div>

          {joinError ? (
            <div className="mt-3 rounded-xl border border-[#D6DED9] bg-white/70 p-3 text-xs text-[#5F6B64]">
              {joinError}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#5F6B64]">
              Acesso libera {ENTER_EARLY_MIN} min antes do início e bloqueia
              após o fim.
            </p>

            {room.status === "cancelled" ? null : canEnterSession ? (
              <button
                onClick={onJoinSession}
                disabled={joinBusy}
                className="inline-flex items-center justify-center rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {joinBusy ? "Abrindo…" : joinLabel}
              </button>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center rounded-xl border border-[#D6DED9] bg-white px-4 py-2 text-sm font-semibold text-[#5F6B64] opacity-70"
              >
                Entrar na sessão
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ESQUERDA: orientações + vídeo */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">Orientações</p>
            <div className="mt-3 space-y-2 text-sm text-[#5F6B64]">
              <p>
                A sessão só fica acessível durante o horário (com tolerância de{" "}
                {ENTER_EARLY_MIN} min antes).
              </p>
              <p>
                Cancelamento com reembolso até 24h antes. Menos que isso, apenas
                reagendamento.
              </p>
            </div>
          </div>

          {/* ✅ vídeo dentro da página */}
          {room.appointment_type === "video" ? (
            <div
              id="video"
              className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#111111]">Vídeo</p>
                <p className="text-xs text-[#5F6B64]">Durante a sessão</p>
              </div>

              <div className="mt-4 space-y-3">
                {!canVideo ? (
                  <div className="rounded-xl border border-[#D6DED9] bg-white p-3 text-sm text-[#5F6B64]">
                    Vídeo disponível {ENTER_EARLY_MIN} min antes do início e até
                    o fim da sessão.
                  </div>
                ) : null}

                {!dailyUrl ? (
                  <button
                    disabled={!canVideo || joinBusy}
                    onClick={onJoinSession}
                    className="w-full rounded-xl bg-[#111111] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {joinBusy ? "Preparando sala…" : "Iniciar vídeo"}
                  </button>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#D6DED9] bg-white">
                    <div className="flex items-center justify-between border-b border-[#D6DED9] p-3">
                      <p className="text-xs font-semibold text-[#111111]">
                        Sala de vídeo ativa
                      </p>
                      <button
                        onClick={() => setDailyUrl(null)}
                        className="rounded-lg border border-[#D6DED9] bg-white px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-white/80"
                      >
                        Fechar
                      </button>
                    </div>

                    <iframe
                      title="Daily Video Call"
                      src={dailyUrl}
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      className="h-[560px] w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Notas read-only (futuro) */}
          <div className="hidden rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-xs font-semibold text-[#111111]">
              Notas (somente leitura)
            </p>
            <p className="mt-2 text-xs text-[#5F6B64] whitespace-pre-wrap">
              {notes.observacoes || "—"}
            </p>
          </div>
        </section>

        {/* DIREITA: chat */}
        <section
          id="chat"
          className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur"
        >
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSend();
                    }}
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
