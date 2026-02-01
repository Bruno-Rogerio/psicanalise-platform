"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";
type AppointmentType = "video" | "chat";

type SessionRoom = {
  id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus | string;
  start_at: string;
  end_at: string;
  patient: { id: string; nome: string } | null;
  professional: { id: string; nome: string } | null;
};

type SessionNotes = {
  queixa: string;
  associacoes: string;
  intervencoes: string;
  plano: string;
  observacoes: string;
};

type ChatMessage = {
  id: string;
  message: string;
  sender_role: "cliente" | "profissional";
  created_at: string;
};

const EMPTY_NOTES: SessionNotes = {
  queixa: "",
  associacoes: "",
  intervencoes: "",
  plano: "",
  observacoes: "",
};

const ENTER_EARLY_MIN = 10;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function isNowWithinSessionWithMargin(
  startISO: string,
  endISO: string,
  earlyMin: number,
) {
  const now = Date.now();
  const start = new Date(startISO).getTime() - earlyMin * 60 * 1000;
  const end = new Date(endISO).getTime();
  return now >= start && now <= end;
}

export default function SessaoDetailPage() {
  const params = useParams();
  const sessionId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<SessionRoom | null>(null);

  const [notes, setNotes] = useState<SessionNotes>(EMPTY_NOTES);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");

  const [chatBusy, setChatBusy] = useState(false);
  const [notesBusy, setNotesBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const [dailyUrl, setDailyUrl] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);

  // Autosave status
  const [autoState, setAutoState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const [autoError, setAutoError] = useState<string | null>(null);

  const lastSavedHashRef = useRef<string>("");
  const autosaveTimerRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);

  const isVideo = room?.appointment_type === "video";
  const isChat = room?.appointment_type === "chat";

  const canEnter = useMemo(() => {
    if (!room) return false;
    if (room.status !== "scheduled" && room.status !== "rescheduled")
      return false;
    return isNowWithinSessionWithMargin(
      room.start_at,
      room.end_at,
      ENTER_EARLY_MIN,
    );
  }, [room]);

  const canStartVideo = useMemo(() => {
    if (!room) return false;
    if (room.appointment_type !== "video") return false;
    if (!canEnter) return false;
    return true;
  }, [room, canEnter]);

  const canChatNow = useMemo(() => {
    if (!room) return false;
    if (room.appointment_type !== "chat") return false;
    if (!canEnter) return false;
    return true;
  }, [room, canEnter]);

  // ✅ Scroll apenas quando VOCÊ envia
  const scrollToBottom = () => {
    const chatContainer = document.getElementById("chat-messages-container");
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  // Load session data
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
              patient:profiles!appointments_user_id_fkey ( id, nome ),
              professional:profiles!appointments_profissional_id_fkey ( id, nome )
            `,
          )
          .eq("id", sessionId)
          .single();

        if (error) throw error;

        const normalized: SessionRoom = {
          ...data,
          patient:
            (Array.isArray(data.patient) ? data.patient[0] : data.patient) ??
            null,
          professional:
            (Array.isArray(data.professional)
              ? data.professional[0]
              : data.professional) ?? null,
        };

        setRoom(normalized);

        // Load notes (se não tiver, mantém vazio)
        const { data: notesData, error: notesErr } = await supabase
          .from("session_notes")
          .select("*")
          .eq("appointment_id", sessionId)
          .maybeSingle();

        if (!notesErr && notesData) {
          const loaded: SessionNotes = {
            queixa: notesData.queixa ?? "",
            associacoes: notesData.associacoes ?? "",
            intervencoes: notesData.intervencoes ?? "",
            plano: notesData.plano ?? "",
            observacoes: notesData.observacoes ?? "",
          };
          setNotes(loaded);

          const hash = JSON.stringify(loaded);
          lastSavedHashRef.current = hash;
          setAutoState("saved");
        } else {
          setNotes(EMPTY_NOTES);
          lastSavedHashRef.current = JSON.stringify(EMPTY_NOTES);
          setAutoState("idle");
        }

        // Load chat messages
        const { data: messagesData } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("appointment_id", sessionId)
          .order("created_at", { ascending: true });

        setMessages(messagesData ?? []);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // Poll messages
  useEffect(() => {
    if (!room) return;

    if (pollRef.current) window.clearInterval(pollRef.current);

    pollRef.current = window.setInterval(async () => {
      try {
        const { data } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("appointment_id", sessionId)
          .order("created_at", { ascending: true });

        if (data) setMessages(data);
      } catch {
        // ignore
      }
    }, 3500);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [room, sessionId]);

  // ======= SAVE NOTES (manual e autosave usam a mesma função) =======
  async function saveNotes({ showToast }: { showToast: boolean }) {
    if (!sessionId) return;
    if (!room) return;

    try {
      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const profId = sess.session?.user?.id;
      if (!profId) throw new Error("Não autenticado");

      const payload = {
        appointment_id: sessionId,
        profissional_id: room.professional?.id ?? profId,
        user_id: room.patient?.id,
        ...notes,
      };

      if (!payload.user_id) {
        throw new Error("Paciente não identificado para salvar o prontuário.");
      }

      const { error } = await supabase
        .from("session_notes")
        .upsert(payload, { onConflict: "appointment_id" });

      if (error) throw error;

      const hash = JSON.stringify(notes);
      lastSavedHashRef.current = hash;
      setAutoState("saved");
      setAutoError(null);

      if (showToast) alert("Prontuário salvo com sucesso!");
    } catch (e: any) {
      console.error(e);
      setAutoState("error");
      setAutoError(e?.message ?? "Erro ao salvar.");
      if (showToast) alert(e?.message ?? "Erro ao salvar prontuário.");
    }
  }

  async function handleSaveNotes() {
    setNotesBusy(true);
    try {
      setAutoState("saving");
      await saveNotes({ showToast: true });
    } finally {
      setNotesBusy(false);
    }
  }

  // ======= AUTOSAVE (debounce) =======
  useEffect(() => {
    if (!room) return;

    const currentHash = JSON.stringify(notes);

    if (currentHash === lastSavedHashRef.current) {
      // sem mudanças reais
      if (autoState === "dirty") setAutoState("saved");
      return;
    }

    // marca como "tem alterações"
    setAutoState("dirty");
    setAutoError(null);

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = window.setTimeout(async () => {
      setAutoState("saving");
      await saveNotes({ showToast: false });
    }, 900);

    return () => {
      if (autosaveTimerRef.current)
        window.clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, room]);

  // ======= CHAT SEND =======
  async function handleSendMessage() {
    if (!sessionId || !msg.trim()) return;

    // Para sessão por chat, respeita horário
    if (isChat && !canChatNow) return;

    setChatBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) throw new Error("Não autenticado");

      const { error } = await supabase.from("chat_messages").insert({
        appointment_id: sessionId,
        sender_id: auth.user.id,
        sender_role: "profissional",
        message: msg.trim(),
      });

      if (error) throw error;

      setMsg("");

      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("appointment_id", sessionId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);

      setTimeout(() => scrollToBottom(), 100);
    } catch (e: any) {
      alert(e?.message ?? "Erro ao enviar mensagem.");
    } finally {
      setChatBusy(false);
    }
  }

  // ======= VIDEO JOIN =======
  async function handleJoinVideo() {
    if (!sessionId || !room) return;
    if (!canStartVideo) return;

    setJoinBusy(true);
    try {
      const resp = await fetch("/api/daily/ensure-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: sessionId }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok)
        throw new Error(json?.error || "Falha ao abrir sala de vídeo.");

      const url = new URL(json.url);
      url.searchParams.set("t", json.token);
      setDailyUrl(url.toString());
    } catch (e: any) {
      alert(e?.message ?? "Erro ao entrar na sessão.");
    } finally {
      setJoinBusy(false);
    }
  }

  async function handleCompleteSession() {
    if (!sessionId) return;
    if (!confirm("Marcar esta sessão como realizada?")) return;

    setStatusBusy(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", sessionId);

      if (error) throw error;

      setRoom((prev) => (prev ? { ...prev, status: "completed" } : null));
      alert("Sessão marcada como realizada!");
    } catch (e: any) {
      alert(e?.message ?? "Erro ao atualizar status.");
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-32 animate-pulse rounded-3xl bg-warm-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-3xl bg-warm-200" />
          <div className="h-96 animate-pulse rounded-3xl bg-warm-200" />
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
          Verifique o ID ou volte para suas sessões.
        </p>
        <Link
          href="/profissional/sessoes"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sage-500 px-6 py-3 text-sm font-semibold text-white shadow-soft-lg transition-all hover:bg-sage-600"
        >
          Ver sessões
        </Link>
      </div>
    );
  }

  const startDate = new Date(room.start_at);
  const endDate = new Date(room.end_at);

  // Layout:
  // - vídeo: 3 colunas [vídeo] [chat aux] [anotações]
  // - chat: 2 colunas [chat] [anotações]
  const gridColsLg = isVideo ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* HEADER */}
      <header className="overflow-hidden rounded-3xl border-2 border-warm-200/60 bg-gradient-to-br from-white/90 to-warm-50/60 p-6 shadow-soft-lg backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`group flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-soft-lg transition-transform duration-300 hover:scale-105 ${
                isVideo
                  ? "bg-gradient-to-br from-rose-500 to-rose-600"
                  : "bg-gradient-to-br from-indigo-500 to-indigo-600"
              }`}
            >
              {isVideo ? (
                <VideoIcon className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
              ) : (
                <ChatIcon className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-warm-900 sm:text-3xl">
                Sessão de {isVideo ? "Vídeo" : "Chat"}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-warm-600">
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {fmtDate(startDate)}
                </span>
                <span className="text-warm-400">•</span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {fmtTime(startDate)}–{fmtTime(endDate)}
                </span>
              </p>

              {room.patient?.nome && (
                <p className="mt-2 flex items-center gap-2 text-sm text-warm-700">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-xs font-semibold text-rose-700">
                    {room.patient.nome.charAt(0)}
                  </div>
                  <span className="font-medium">{room.patient.nome}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={room.status} />

            <Link
              href="/profissional/sessoes"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-warm-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-warm-700 shadow-soft backdrop-blur-sm transition-all hover:bg-warm-50 hover:shadow-soft-lg"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar
            </Link>

            {room.status === "scheduled" && (
              <button
                disabled={statusBusy}
                onClick={handleCompleteSession}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-soft transition-all hover:bg-emerald-100 hover:shadow-soft-lg disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {statusBusy ? "Salvando..." : "Marcar como realizada"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* GRID */}
      <div className={`grid gap-6 ${gridColsLg}`}>
        {/* =========================
            COLUNA 1 (VÍDEO ou CHAT)
        ========================= */}
        <section className="space-y-6">
          {/* VÍDEO */}
          {isVideo ? (
            <div className="overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-soft-lg">
              <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 shadow-lg">
                      <VideoIcon className="h-5 w-5 text-white" />
                      {dailyUrl && (
                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-warm-900">
                        {dailyUrl ? "Sala ativa • Ao vivo" : "Vídeo"}
                      </p>
                      <p className="text-xs text-warm-600">
                        {dailyUrl
                          ? "Conexão segura"
                          : "Inicie no horário da sessão"}
                      </p>
                    </div>
                  </div>

                  {!dailyUrl ? (
                    <button
                      disabled={joinBusy || !canStartVideo}
                      onClick={handleJoinVideo}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {joinBusy ? "Preparando..." : "Iniciar"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setDailyUrl(null)}
                      className="rounded-lg border-2 border-warm-300 bg-white px-4 py-2 text-xs font-semibold text-warm-700 transition-all hover:bg-warm-50"
                    >
                      Sair
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-warm-50/30 p-4">
                {dailyUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-warm-900">
                    <iframe
                      title="Sessão de vídeo"
                      src={dailyUrl}
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-300 bg-white/60 p-6 text-center">
                    <p className="text-sm font-semibold text-warm-700">
                      Vídeo ainda não iniciado
                    </p>
                    <p className="mt-1 text-xs text-warm-500">
                      {canStartVideo
                        ? "Clique em Iniciar para abrir a sala"
                        : "Disponível apenas no horário da sessão"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CHAT PRINCIPAL (sessão por chat) */
            <div className="overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-soft-lg">
              <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg">
                    <ChatIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">
                      Chat da sessão
                    </p>
                    <p className="text-xs text-warm-600">
                      Mensagens com o paciente
                    </p>
                  </div>
                </div>
              </div>

              <div
                id="chat-messages-container"
                className="h-[500px] space-y-3 overflow-y-auto bg-warm-50/30 p-5"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-300 bg-white/50 p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-warm-100">
                      <ChatIcon className="h-8 w-8 text-warm-400" />
                    </div>
                    <p className="font-semibold text-warm-700">
                      Nenhuma mensagem
                    </p>
                    <p className="mt-1 text-sm text-warm-500">
                      O chat aparecerá aqui durante a sessão
                    </p>
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

              <div className="border-t-2 border-warm-200 bg-white p-4">
                {!canChatNow ? (
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
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <button
                      disabled={chatBusy || !msg.trim()}
                      onClick={handleSendMessage}
                      className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 shadow-soft transition-all hover:shadow-soft-lg disabled:opacity-50"
                    >
                      <SendIcon className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informações (opcional) */}
          <div className="overflow-hidden rounded-2xl border border-warm-300/50 bg-gradient-to-br from-white to-warm-50/30 p-6 shadow-soft">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-warm-700">
              <InfoIcon className="h-4 w-4" />
              Informações da sessão
            </p>

            <div className="space-y-3">
              <InfoItem
                icon={<UserIcon className="h-4 w-4" />}
                label="Paciente"
                value={room.patient?.nome || "Paciente não identificado"}
              />
              <InfoItem
                icon={<CalendarIcon className="h-4 w-4" />}
                label="Data"
                value={fmtDate(startDate)}
              />
              <InfoItem
                icon={<ClockIcon className="h-4 w-4" />}
                label="Horário"
                value={`${fmtTime(startDate)} – ${fmtTime(endDate)}`}
              />
              <InfoItem
                icon={
                  isVideo ? (
                    <VideoIcon className="h-4 w-4" />
                  ) : (
                    <ChatIcon className="h-4 w-4" />
                  )
                }
                label="Tipo"
                value={isVideo ? "Videochamada" : "Chat por texto"}
              />
            </div>
          </div>
        </section>

        {/* =========================
            COLUNA 2 (somente no VÍDEO): CHAT AUX
        ========================= */}
        {isVideo && (
          <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-soft-lg">
              <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg">
                    <ChatIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">
                      Chat auxiliar
                    </p>
                    <p className="text-xs text-warm-600">
                      Mensagens com o paciente
                    </p>
                  </div>
                </div>
              </div>

              <div
                id="chat-messages-container"
                className="h-[500px] space-y-3 overflow-y-auto bg-warm-50/30 p-5"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-300 bg-white/50 p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-warm-100">
                      <ChatIcon className="h-8 w-8 text-warm-400" />
                    </div>
                    <p className="font-semibold text-warm-700">
                      Nenhuma mensagem
                    </p>
                    <p className="mt-1 text-sm text-warm-500">
                      Use o chat para complementar durante o vídeo
                    </p>
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

              <div className="border-t-2 border-warm-200 bg-white p-4">
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
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <button
                    disabled={chatBusy || !msg.trim()}
                    onClick={handleSendMessage}
                    className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 shadow-soft transition-all hover:shadow-soft-lg disabled:opacity-50"
                  >
                    <SendIcon className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================
            ÚLTIMA COLUNA: ANOTAÇÕES
            - vídeo: é a 3ª coluna
            - chat: é a 2ª coluna
        ========================= */}
        <section className="space-y-6">
          <div className="overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-soft-lg">
            <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 shadow-lg">
                    <FileTextIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-900">Anotações</p>
                    <p className="text-xs text-warm-600">
                      Registro confidencial
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AutoSavePill state={autoState} error={autoError} />

                  <button
                    disabled={notesBusy}
                    onClick={handleSaveNotes}
                    className="inline-flex items-center gap-2 rounded-lg bg-sage-500 px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-sage-600 disabled:opacity-50"
                  >
                    <SaveIcon className="h-4 w-4" />
                    {notesBusy ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] space-y-4 overflow-y-auto p-5">
              <NoteField
                label="Queixa"
                placeholder="O que o paciente trouxe na sessão..."
                value={notes.queixa}
                onChange={(v) => setNotes({ ...notes, queixa: v })}
                rows={3}
              />
              <NoteField
                label="Associações"
                placeholder="Associações livres, memórias..."
                value={notes.associacoes}
                onChange={(v) => setNotes({ ...notes, associacoes: v })}
                rows={3}
              />
              <NoteField
                label="Intervenções"
                placeholder="Intervenções realizadas..."
                value={notes.intervencoes}
                onChange={(v) => setNotes({ ...notes, intervencoes: v })}
                rows={3}
              />
              <NoteField
                label="Plano"
                placeholder="Plano para próximas sessões..."
                value={notes.plano}
                onChange={(v) => setNotes({ ...notes, plano: v })}
                rows={3}
              />
              <NoteField
                label="Observações"
                placeholder="Outras observações relevantes..."
                value={notes.observacoes}
                onChange={(v) => setNotes({ ...notes, observacoes: v })}
                rows={4}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-warm-300/50 bg-gradient-to-br from-soft-50 to-warm-50 p-6 shadow-soft">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-warm-700">
              <LightbulbIcon className="h-4 w-4" />
              Lembretes importantes
            </p>
            <div className="space-y-3 text-sm text-warm-600">
              <TipItem text="Mantenha o sigilo profissional" />
              <TipItem text="Registre pontos-chave no prontuário" />
              <TipItem text="Salve antes de sair, se fizer grandes alterações" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function AutoSavePill({
  state,
  error,
}: {
  state: "idle" | "dirty" | "saving" | "saved" | "error";
  error: string | null;
}) {
  const cfg =
    state === "saving"
      ? {
          label: "Salvando...",
          cls: "bg-amber-50 text-amber-700 border-amber-200",
        }
      : state === "dirty"
        ? {
            label: "Alterações",
            cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
          }
        : state === "saved"
          ? {
              label: "Salvo",
              cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
            }
          : state === "error"
            ? { label: "Erro", cls: "bg-rose-50 text-rose-700 border-rose-200" }
            : {
                label: " ",
                cls: "bg-transparent text-transparent border-transparent",
              };

  return (
    <span
      title={state === "error" ? (error ?? "Erro ao salvar") : undefined}
      className={`inline-flex min-w-[86px] items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

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
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
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
        className="w-full resize-none rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-900 outline-none transition-all focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100"
      />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sage-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-warm-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-warm-900">
          {value}
        </p>
      </div>
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

/* =========================================================
   ÍCONES
========================================================= */

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

function FileTextIcon({ className }: { className?: string }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
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
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
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

function UserIcon({ className }: { className?: string }) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
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
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
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
