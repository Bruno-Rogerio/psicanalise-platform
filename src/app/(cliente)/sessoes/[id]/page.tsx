// src/app/(cliente)/sessoes/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReviewModal } from "@/components/avaliacoes/ReviewModal";
import { supabase } from "@/lib/supabase";

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

const ENTER_EARLY_MIN = 10;
const VIDEO_END_GRACE_MIN = 0;

function isNowAllowedForVideo(startISO: string, endISO: string) {
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
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [dailyUrl, setDailyUrl] = useState<string | null>(null);
  // Estados para avaliação
  const [showReviewModal, setShowReviewModal] = useState(false);
  // ⚠️ DEBUG - Monitora mudanças no estado
  useEffect(() => {
    console.log("🔄 showReviewModal mudou para:", showReviewModal);
  }, [showReviewModal]);
  const [userInfo, setUserInfo] = useState<{ id: string; nome: string } | null>(
    null,
  );

  const pollRef = useRef<number | null>(null);
  const videoWatchRef = useRef<number | null>(null);

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

  // ✅ Scroll apenas quando VOCÊ envia mensagem
  const scrollToBottom = () => {
    const chatContainer = document.getElementById("chat-messages-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  // Load inicial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Busca dados do usuário logado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("👤 Usuário autenticado:", user);

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, nome")
            .eq("id", user.id)
            .single();

          console.log("📋 Profile carregado:", profile);
          console.log("❌ Erro ao carregar profile:", profileError);

          if (profile) {
            setUserInfo(profile);
          } else {
            // Fallback: usa dados do próprio user
            setUserInfo({
              id: user.id,
              nome: user.email?.split("@")[0] || "Usuário",
            });
          }
        }
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

  // Poll mensagens
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

  // Auto-encerrar sessão e mostrar avaliação
  useEffect(() => {
    if (!room) return;

    if (videoWatchRef.current) window.clearInterval(videoWatchRef.current);

    videoWatchRef.current = window.setInterval(() => {
      const now = Date.now();
      const endTime = new Date(room.end_at).getTime();
      const sessionEnded = now > endTime;

      // Para sessões de VÍDEO
      if (room.appointment_type === "video") {
        const allowed = isNowAllowedForVideo(room.start_at, room.end_at);
        if (!allowed && dailyUrl) {
          setDailyUrl(null);
          setJoinError("Sessão encerrada. O horário do atendimento terminou.");

          // ✅ ABRE MODAL DE AVALIAÇÃO
          setTimeout(() => {
            setShowReviewModal(true);
          }, 2000);
        }
      }

      // Para sessões de CHAT
      if (room.appointment_type === "chat") {
        if (sessionEnded && !showReviewModal) {
          // ✅ ABRE MODAL DE AVALIAÇÃO
          setTimeout(() => {
            setShowReviewModal(true);
          }, 2000);
        }
      }
    }, 15000); // Verifica a cada 15 segundos

    return () => {
      if (videoWatchRef.current) window.clearInterval(videoWatchRef.current);
    };
  }, [room, dailyUrl, showReviewModal]);

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

      // ✅ Scroll automático apenas quando VOCÊ envia
      setTimeout(() => scrollToBottom(), 100);
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

    if (room.appointment_type === "chat") {
      const el = document.getElementById("chat-area");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

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

      const json = (await resp.json().catch(() => ({}))) as any;

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

      setTimeout(() => {
        const el = document.getElementById("video-player");
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
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-32 animate-pulse rounded-3xl bg-warm-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-3xl bg-warm-200 lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-3xl bg-warm-200" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-warm-200">
          <AlertTriangleIcon className="h-10 w-10 text-warm-500" />
        </div>
        <h1 className="text-2xl font-bold text-warm-900">
          Sessão não encontrada
        </h1>
        <p className="mt-2 text-warm-600">
          Não conseguimos localizar esta sessão. Verifique o link ou volte para
          suas sessões.
        </p>
        <Link
          href="/minhas-sessoes"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sage-500 px-6 py-3 text-sm font-semibold text-white shadow-soft-lg transition-all hover:bg-sage-600"
        >
          Ver minhas sessões
        </Link>
      </div>
    );
  }

  const start = new Date(room.start_at);
  const end = new Date(room.end_at);
  const isVideo = room.appointment_type === "video";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ==========================================
          ✨ HEADER MODERNO COM GLASSMORPHISM
      ========================================== */}
      <header className="overflow-hidden rounded-3xl border-2 border-warm-200/60 bg-gradient-to-br from-white/90 to-warm-50/60 p-6 shadow-soft-lg backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Info da sessão */}
          <div className="flex items-start gap-4">
            {/* Ícone gradiente animado */}
            <div
              className={`group flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-soft-lg transition-transform duration-300 hover:scale-105 ${
                isVideo
                  ? "bg-gradient-to-br from-rose-400 to-rose-500"
                  : "bg-gradient-to-br from-indigo-400 to-indigo-500"
              }`}
            >
              {isVideo ? (
                <VideoIcon className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
              ) : (
                <ChatBubbleIcon className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-warm-900 sm:text-3xl">
                Sua Sessão
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-warm-600">
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {fmtDate(start)}
                </span>
                <span className="text-warm-400">•</span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {fmtTime(start)}–{fmtTime(end)}
                </span>
              </p>

              {room.professional?.nome && (
                <p className="mt-2 flex items-center gap-2 text-sm text-warm-700">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sage-100 to-sage-200 text-xs font-semibold text-sage-700">
                    {room.professional.nome.charAt(0)}
                  </div>
                  <span className="font-medium">{room.professional.nome}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Ações */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Badge */}
            <StatusBadge status={room.status} />

            {/* Botão Voltar */}
            <Link
              href="/minhas-sessoes"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-warm-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-warm-700 shadow-soft backdrop-blur-sm transition-all hover:bg-warm-50 hover:shadow-soft-lg"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar
            </Link>

            {/* ⚠️ BOTÃO DE TESTE - ADICIONAR AQUI */}
            <button
              onClick={() => {
                console.log("🧪 Teste: Abrindo modal");
                console.log("Room:", room);
                console.log("UserInfo:", userInfo);
                console.log("UserInfo:", userInfo); // ← Veja o que aparece
                console.log("ShowReviewModal:", showReviewModal);
                setShowReviewModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700"
            >
              🧪 Testar
            </button>
            {/* FIM DO BOTÃO DE TESTE */}

            {/* Botão Entrar (quando disponível) */}
            {room.status === "scheduled" && canEnterSession && (
              <button
                disabled={joinBusy}
                onClick={onJoinSession}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 px-6 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-soft-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {joinBusy ? (
                    <>
                      <SpinnerIcon className="h-4 w-4 animate-spin" />
                      Preparando...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4" />
                      {isVideo ? "Iniciar vídeo" : "Abrir chat"}
                      {/* Indicator pulsante */}
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                      </span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-sage-600 to-sage-700 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {joinError && (
          <div className="mt-6 animate-slide-up overflow-hidden rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <AlertIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">Atenção</p>
                <p className="mt-1 text-sm text-amber-700">{joinError}</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ==========================================
          📹 ÁREA PRINCIPAL: VÍDEO + CHAT
      ========================================== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ========== COLUNA ESQUERDA: VÍDEO/INFO ========== */}
        <section className="space-y-6 lg:col-span-2">
          {/* 🎥 PLAYER DE VÍDEO (quando ativo) */}
          {isVideo && dailyUrl && (
            <div
              id="video-player"
              className="group animate-fade-in overflow-hidden rounded-3xl border-2 border-warm-200 bg-warm-900 shadow-soft-xl transition-all"
            >
              {/* Header do player */}
              <div className="flex items-center justify-between border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 shadow-lg">
                    <VideoIcon className="h-5 w-5 text-white" />
                    {/* Indicador "ao vivo" */}
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">
                      Sala ativa • Ao vivo
                    </p>
                    <p className="text-xs text-warm-600">
                      Conexão segura e criptografada
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDailyUrl(null)}
                  className="group/btn rounded-lg border-2 border-warm-300 bg-white px-4 py-2 text-xs font-semibold text-warm-700 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                >
                  <span className="flex items-center gap-2">
                    <XIcon className="h-4 w-4 transition-transform group-hover/btn:rotate-90" />
                    Sair
                  </span>
                </button>
              </div>

              {/* Iframe do vídeo */}
              <div className="relative aspect-video w-full bg-warm-900">
                <iframe
                  title="Sessão de vídeo"
                  src={dailyUrl}
                  allow="camera; microphone; fullscreen; speaker; display-capture"
                  className="h-full w-full"
                />
              </div>
            </div>
          )}

          {/* 📝 INSTRUÇÕES (quando vídeo não iniciado) */}
          {isVideo && !dailyUrl && (
            <div className="overflow-hidden rounded-3xl border-2 border-warm-200 bg-gradient-to-br from-white to-warm-50/30 p-8 shadow-soft-lg sm:p-10">
              <div className="mx-auto max-w-md text-center">
                {/* Ícone central */}
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 shadow-soft-lg">
                  <VideoIcon className="h-12 w-12 text-white" />
                </div>

                <h3 className="text-xl font-bold text-warm-900">
                  {canVideo ? "Pronto para começar" : "Aguardando horário"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-600">
                  {canVideo
                    ? "Clique no botão acima para entrar na sala e iniciar sua sessão."
                    : `A sala de vídeo estará disponível ${ENTER_EARLY_MIN} minutos antes do horário agendado.`}
                </p>

                {canVideo && (
                  <div className="mt-8 space-y-3 rounded-2xl bg-warm-50 p-6 text-left">
                    <p className="text-sm font-semibold text-warm-700">
                      Antes de começar:
                    </p>
                    <CheckListItem text="Encontre um local tranquilo e privado" />
                    <CheckListItem text="Verifique sua câmera e microfone" />
                    <CheckListItem text="Mantenha uma conexão estável" />
                  </div>
                )}

                {!canVideo && (
                  <div className="mt-6 rounded-xl bg-warm-100 p-4">
                    <p className="text-xs text-warm-600">
                      A sessão inicia em {fmtTime(start)}. Você poderá entrar a
                      partir de{" "}
                      {fmtTime(
                        new Date(start.getTime() - ENTER_EARLY_MIN * 60000),
                      )}
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 💬 ÁREA DE CHAT (apenas para tipo chat) */}
          {!isVideo && (
            <div
              id="chat-area"
              className="overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-soft-lg"
            >
              <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg">
                    <ChatBubbleIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">
                      Chat da Sessão
                    </p>
                    <p className="text-xs text-warm-600">
                      Espaço seguro para conversar
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensagens - ✅ ADICIONA ID AQUI */}
              <div
                id="chat-messages-container"
                className="h-[500px] space-y-3 overflow-y-auto bg-warm-50/30 p-5"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-300 bg-white/50 p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-warm-100">
                      <ChatBubbleIcon className="h-8 w-8 text-warm-400" />
                    </div>
                    <p className="font-semibold text-warm-700">
                      Nenhuma mensagem ainda
                    </p>
                    <p className="mt-1 text-sm text-warm-500">
                      {canChat
                        ? "Comece a conversar quando quiser."
                        : "O chat estará disponível durante a sessão."}
                    </p>
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

              {/* Input de mensagem */}
              <div className="border-t-2 border-warm-200 bg-white p-4">
                {!canChat ? (
                  <div className="rounded-xl bg-warm-50 p-3 text-center text-xs text-warm-600">
                    Chat disponível apenas durante o horário da sessão.
                  </div>
                ) : (
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <textarea
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        rows={2}
                        className="w-full resize-none rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-900 outline-none transition-all focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                          }
                        }}
                      />
                    </div>
                    <button
                      disabled={chatBusy || !msg.trim()}
                      onClick={onSend}
                      className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 shadow-soft transition-all hover:shadow-soft-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <SendIcon className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ℹ️ INFORMAÇÕES ADICIONAIS */}
          <div className="overflow-hidden rounded-2xl border border-warm-300/50 bg-warm-50/50 p-6 backdrop-blur-sm">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-warm-700">
              <InfoIcon className="h-4 w-4" />
              Informações importantes
            </p>
            <div className="space-y-2 text-sm text-warm-600">
              <InfoRow
                icon="✓"
                text="Sigilo profissional e privacidade garantidos"
              />
              <InfoRow
                icon="✓"
                text="Cancelamento com reembolso até 24h antes"
              />
              <InfoRow
                icon="✓"
                text="Gravações não são permitidas por ambas as partes"
              />
            </div>
          </div>
        </section>

        {/* ========== COLUNA DIREITA: CHAT AUXILIAR ========== */}
        <aside className="space-y-6">
          {/* 💬 CHAT (para sessões de vídeo) */}
          {isVideo && (
            <div className="overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-soft-lg">
              <div className="border-b border-warm-200 bg-gradient-to-r from-warm-50 to-white px-4 py-3">
                <p className="text-sm font-semibold text-warm-900">
                  Chat auxiliar
                </p>
                <p className="text-xs text-warm-600">
                  Mensagens durante a sessão
                </p>
              </div>

              {/* Mensagens - ✅ ADICIONA ID AQUI TAMBÉM */}
              <div
                id="chat-messages-container"
                className="h-[400px] space-y-2 overflow-y-auto bg-warm-50/30 p-4"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-warm-300 bg-white/50 p-6 text-center">
                    <ChatBubbleIcon className="mb-3 h-10 w-10 text-warm-300" />
                    <p className="text-xs text-warm-500">
                      Use o chat para complementar a conversa, se necessário.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <ChatBubbleCompact
                      key={m.id}
                      mine={m.sender_role === "cliente"}
                      body={m.message}
                      at={m.created_at}
                    />
                  ))
                )}
              </div>

              {/* Input */}
              <div className="border-t border-warm-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Mensagem..."
                    className="h-10 flex-1 rounded-lg border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900 outline-none transition-all focus:border-sage-400 focus:bg-white focus:ring-2 focus:ring-sage-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSend();
                    }}
                  />
                  <button
                    disabled={chatBusy || !msg.trim()}
                    onClick={onSend}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-500 shadow-soft transition-all hover:bg-sage-600 disabled:opacity-50"
                  >
                    <SendIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 📋 DICAS E AJUDA */}
          <div className="overflow-hidden rounded-2xl border border-warm-300/50 bg-gradient-to-br from-soft-50 to-warm-50 p-6 shadow-soft">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-warm-700">
              <SparklesIcon className="h-4 w-4" />
              Dicas para aproveitar melhor
            </p>
            <div className="space-y-3 text-sm text-warm-600">
              <TipItem text="Seja autêntico e fale o que vier à mente" />
              <TipItem text="Não há julgamentos neste espaço" />
              <TipItem text="O silêncio também faz parte" />
            </div>
          </div>
        </aside>
      </div>
      {/* ========== MODAL DE AVALIAÇÃO ========== */}
      {room && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            console.log("❌ Fechando modal");
            setShowReviewModal(false);
          }}
          appointmentId={appointmentId}
          professionalId={room.profissional_id}
          userId={userInfo?.id || room.user_id}
          userName={userInfo?.nome || "Usuário"}
        />
      )}
    </div>
  );
}

// ==========================================
// 🎨 COMPONENTES AUXILIARES
// ==========================================

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { label: string; className: string; icon?: React.ReactNode }
  > = {
    scheduled: {
      label: "Agendada",
      className: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <ClockIcon className="h-3.5 w-3.5" />,
    },
    completed: {
      label: "Realizada",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: <CheckCircleIcon className="h-3.5 w-3.5" />,
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-rose-100 text-rose-700 border-rose-200",
      icon: <XCircleIcon className="h-3.5 w-3.5" />,
    },
    rescheduled: {
      label: "Reagendada",
      className: "bg-indigo-100 text-indigo-700 border-indigo-200",
      icon: <RefreshIcon className="h-3.5 w-3.5" />,
    },
  };

  const config = configs[status] || {
    label: status,
    className: "bg-warm-100 text-warm-700 border-warm-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
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
    <div
      className={`flex animate-slide-up ${mine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group max-w-[85%] rounded-2xl px-4 py-3 shadow-soft transition-all hover:shadow-soft-lg ${
          mine
            ? "bg-[#111111] text-white"
            : "border-2 border-warm-200 bg-white text-warm-900"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
        <p
          className={`mt-1.5 text-[11px] ${mine ? "text-white/80" : "text-warm-500"}`}
        >
          {fmtTime(new Date(at))}
        </p>
      </div>
    </div>
  );
}

function ChatBubbleCompact({
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
        className={`max-w-[90%] rounded-xl px-3 py-2 text-xs ${
          mine
            ? "bg-sage-500 text-white"
            : "border border-warm-200 bg-white text-warm-900"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        <p
          className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-warm-500"}`}
        >
          {fmtTime(new Date(at))}
        </p>
      </div>
    </div>
  );
}

function CheckListItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-100">
        <CheckIcon className="h-3 w-3 text-sage-600" />
      </div>
      <p className="text-sm text-warm-700">{text}</p>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sage-600">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-soft-400" />
      <p>{text}</p>
    </div>
  );
}

// ==========================================
// 🎯 ÍCONES SVG
// ==========================================

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

function ChatBubbleIcon({ className }: { className?: string }) {
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

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
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
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
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
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
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
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
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
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
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
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
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
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
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
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
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
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
