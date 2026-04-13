"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { CalendarMonth } from "@/components/shared/agenda/CalendarMonth";
import { SlotsGrid } from "@/components/shared/agenda/SlotsGrid";
import { BuyCreditsSection } from "@/components/agenda/BuyCreditsSection";
import {
  getProfessional,
  getSettings,
  getRules,
  getBlocks,
  getBookedAppointments,
  getProducts,
  getCreditsBalance,
  generateSlotsForDay,
  MIN_SCHEDULE_LEAD_HOURS,
  type AppointmentType,
  type Slot,
  type ProfessionalSettings,
  type AvailabilityRule,
  type AvailabilityBlock,
  type Appointment,
  type Product,
} from "@/services/agenda";

export default function AgendaPage() {
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProfessionalSettings | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [booked, setBooked] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [credits, setCredits] = useState({ total: 0, used: 0, available: 0 });

  // UI State
  const [type, setType] = useState<AppointmentType | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [pickedSlot, setPickedSlot] = useState<Slot | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Derive current step
  const currentStep = useMemo(() => {
    if (pickedSlot) return 3;
    if (type && selectedDay) return 2;
    if (type) return 2;
    return 1;
  }, [type, selectedDay, pickedSlot]);

  const needsCredits = !!type && credits.available === 0;

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const prof = await getProfessional();
        setProfessionalId(prof.id);
        const s = await getSettings(prof.id);
        setSettings(s);
        const r = await getRules(prof.id);
        setRules(r);
        const from = startOfDay(new Date());
        const to = addDays(from, 45);
        const [b, a] = await Promise.all([
          getBlocks(prof.id, from.toISOString(), to.toISOString()),
          getBookedAppointments(prof.id, from.toISOString(), to.toISOString()),
        ]);
        setBlocks(b);
        setBooked(a);
        const prods = await getProducts(prof.id, "video");
        setProducts(prods);
        setSelectedProductId(prods[0]?.id ?? null);
        const bal = await getCreditsBalance(prof.id, "video");
        setCredits(bal);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Update products when type changes
  useEffect(() => {
    (async () => {
      if (!professionalId || !type) return;
      const prods = await getProducts(professionalId, type);
      setProducts(prods);
      setSelectedProductId(prods[0]?.id ?? null);
      const bal = await getCreditsBalance(professionalId, type);
      setCredits(bal);
      await refreshBooked();
      setPickedSlot(null);
      setSelectedDay(new Date());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, type]);

  // Generate slots for selected day
  const daySlots = useMemo(() => {
    if (!settings || !type || !selectedDay) return [];
    return generateSlotsForDay({ day: selectedDay, type, rules, settings, blocks, booked });
  }, [professionalId, selectedDay, type, rules, settings, blocks, booked]);

  const hasAvailabilityForDay = (d: Date) => {
    if (!settings || !type) return false;
    const slots = generateSlotsForDay({ day: d, type, rules, settings, blocks, booked });
    return slots.length > 0;
  };

  function selectType(t: AppointmentType) {
    setType(t);
    setSelectedDay(new Date());
    setPickedSlot(null);
  }

  function selectDay(d: Date) {
    setSelectedDay(d);
    setPickedSlot(null);
  }

  function pickSlot(slot: Slot) {
    setPickedSlot(slot);
  }

  function resetToStep(step: number) {
    if (step <= 1) {
      setType(null);
      setSelectedDay(null);
      setPickedSlot(null);
    } else if (step <= 2) {
      setPickedSlot(null);
    }
  }

  async function loadCreditsBalance(t?: AppointmentType) {
    if (!professionalId) return;
    const effectiveType = t ?? type;
    if (!effectiveType) return;
    const balance = await getCreditsBalance(professionalId, effectiveType);
    setCredits(balance);
  }

  async function refreshBooked() {
    if (!professionalId) return;
    const from = startOfDay(new Date());
    const to = addDays(from, 45);
    const a = await getBookedAppointments(professionalId, from.toISOString(), to.toISOString());
    setBooked(a);
  }

  async function onUseCredit() {
    if (!professionalId || !pickedSlot) return;
    try {
      const minStartMs = Date.now() + MIN_SCHEDULE_LEAD_HOURS * 60 * 60 * 1000;
      if (pickedSlot.start.getTime() < minStartMs) {
        toast(`Agendamentos precisam de no mínimo ${MIN_SCHEDULE_LEAD_HOURS} horas de antecedência.`, "error");
        setPickedSlot(null);
        return;
      }
      setConfirming(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) throw new Error("Você precisa estar logado.");
      const { error } = await supabase.rpc("book_with_credit", {
        p_prof: professionalId,
        p_type: pickedSlot.appointment_type,
        p_start: pickedSlot.start.toISOString(),
        p_end: pickedSlot.end.toISOString(),
      });
      if (error) throw error;
      router.push("/minhas-sessoes?success=1");
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.includes("SLOT_TAKEN")) {
        toast("Esse horário acabou de ser reservado. Escolha outro.", "error");
        await refreshBooked();
        setPickedSlot(null);
        await loadCreditsBalance(pickedSlot.appointment_type);
        return;
      }
      if (msg.includes("NO_CREDITS")) {
        toast("Você não tem créditos disponíveis para agendar.", "error");
        await loadCreditsBalance(pickedSlot.appointment_type);
        return;
      }
      if (msg.includes("NOT_AUTHENTICATED")) {
        toast("Você precisa estar logado.", "error");
        return;
      }
      toast(e?.message ?? "Erro ao agendar.", "error");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${pickedSlot ? "pb-28 lg:pb-6" : "pb-6"}`}>
      {/* ===== PAGE HEADER ===== */}
      <header className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1A1614] shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl">
          <CalendarPlusIcon className="h-5 w-5 text-white sm:h-7 sm:w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1A1614] sm:text-3xl sm:text-4xl">Agendar Sessão</h1>
          <p className="mt-0.5 text-sm text-[#8B7B72]">Siga os passos para marcar seu horário</p>
        </div>
      </header>

      {/* ===== PROGRESS BAR ===== */}
      <div className="rounded-2xl border border-[#E8E0DC]/80 bg-white p-4 shadow-[0_1px_16px_rgba(44,36,32,0.07)] sm:rounded-3xl sm:p-5">
        <div className="flex items-center justify-between">
          <StepBubble
            number={1}
            label="Tipo"
            sublabel={type ? (type === "video" ? "Vídeo" : "Chat") : "Escolha"}
            status={currentStep === 1 ? "active" : currentStep > 1 ? "done" : "pending"}
            onClick={() => resetToStep(1)}
          />

          <div className="relative mx-2 h-1 flex-1">
            <div className="absolute inset-0 rounded-full bg-[#E8E0DC]" />
            <div className={`absolute inset-y-0 left-0 rounded-full bg-[#4A7C59] transition-all duration-500 ease-out ${currentStep >= 2 ? "w-full" : "w-0"}`} />
          </div>

          <StepBubble
            number={2}
            label="Horário"
            sublabel={
              pickedSlot
                ? `${fmtDateShort(pickedSlot.start)} ${fmtTime(pickedSlot.start)}`
                : selectedDay
                  ? fmtDateShort(selectedDay)
                  : "Escolha"
            }
            status={currentStep === 2 ? "active" : currentStep > 2 ? "done" : "pending"}
            onClick={() => currentStep > 2 && resetToStep(2)}
            disabled={currentStep < 2}
          />

          <div className="relative mx-2 h-1 flex-1">
            <div className="absolute inset-0 rounded-full bg-[#E8E0DC]" />
            <div className={`absolute inset-y-0 left-0 rounded-full bg-[#4A7C59] transition-all duration-500 ease-out ${currentStep >= 3 ? "w-full" : "w-0"}`} />
          </div>

          <StepBubble
            number={3}
            label="Confirmar"
            sublabel={pickedSlot ? "Pronto!" : "Aguardando"}
            status={currentStep === 3 ? "active" : "pending"}
            disabled={currentStep < 3}
          />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-5 lg:col-span-2">

          {/* ===== STEP 1: TIPO ===== */}
          {currentStep > 1 && type ? (
            <div className="rounded-3xl border border-[#4A7C59]/20 bg-[#4A7C59]/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A7C59]">
                    <CheckIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B8F75]">Etapa 1</p>
                    <p className="font-bold text-[#1A1614]">{type === "video" ? "Videochamada" : "Chat por texto"}</p>
                  </div>
                </div>
                <button
                  onClick={() => resetToStep(1)}
                  className="rounded-xl border border-[#4A7C59]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#4A7C59] hover:bg-[#4A7C59]/5"
                >
                  Alterar
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl border-2 bg-white p-4 shadow-[0_1px_16px_rgba(44,36,32,0.07)] transition-all duration-300 sm:rounded-3xl sm:p-6 ${currentStep === 1 ? "border-[#1A1614]" : "border-[#E8E0DC]/80"}`}>
              <div className="mb-4 flex items-center gap-3 sm:mb-6">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black sm:h-10 sm:w-10 sm:text-base ${currentStep === 1 ? "bg-[#1A1614] text-white" : "bg-[#F5F0ED] text-[#B0A098]"}`}>1</div>
                <div>
                  <p className="text-xs text-[#B0A098]">Etapa 1</p>
                  <p className="font-bold text-[#1A1614]">Tipo de atendimento</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {/* Video */}
                <button
                  onClick={() => selectType("video")}
                  className={`group relative flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300 sm:flex-col sm:items-start sm:p-5 ${
                    type === "video"
                      ? "border-[#E8755A] bg-[#E8755A]/5 shadow-lg"
                      : "border-[#E8E0DC] bg-white hover:border-[#E8755A]/40 hover:shadow-md"
                  }`}
                >
                  {type === "video" && (
                    <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#E8755A] sm:right-4 sm:top-4">
                      <CheckIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md sm:h-14 sm:w-14 ${type === "video" ? "bg-[#E8755A]" : "bg-[#E8755A]/10"}`}>
                    <VideoIcon className={`h-6 w-6 sm:h-7 sm:w-7 ${type === "video" ? "text-white" : "text-[#E8755A]"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#1A1614] sm:mt-3 sm:text-lg">Videochamada</p>
                    <p className="mt-0.5 text-sm text-[#8B7B72]">Câmera e áudio ao vivo</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E8755A]/10 px-2.5 py-1 text-xs font-semibold text-[#E8755A] sm:px-3 sm:text-sm">
                      <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {settings?.session_duration_video_min ?? 50} min
                    </div>
                  </div>
                </button>

                {/* Chat */}
                <button
                  onClick={() => selectType("chat")}
                  className={`group relative flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300 sm:flex-col sm:items-start sm:p-5 ${
                    type === "chat"
                      ? "border-[#5B5EA6] bg-[#5B5EA6]/5 shadow-lg"
                      : "border-[#E8E0DC] bg-white hover:border-[#5B5EA6]/40 hover:shadow-md"
                  }`}
                >
                  {type === "chat" && (
                    <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#5B5EA6] sm:right-4 sm:top-4">
                      <CheckIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md sm:h-14 sm:w-14 ${type === "chat" ? "bg-[#5B5EA6]" : "bg-[#5B5EA6]/10"}`}>
                    <ChatBubbleIcon className={`h-6 w-6 sm:h-7 sm:w-7 ${type === "chat" ? "text-white" : "text-[#5B5EA6]"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#1A1614] sm:mt-3 sm:text-lg">Chat por texto</p>
                    <p className="mt-0.5 text-sm text-[#8B7B72]">Mensagens em tempo real</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#5B5EA6]/10 px-2.5 py-1 text-xs font-semibold text-[#5B5EA6] sm:px-3 sm:text-sm">
                      <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {settings?.session_duration_chat_min ?? 50} min
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: DATA E HORÁRIO ===== */}
          {currentStep >= 2 && (
            pickedSlot ? (
              <div className="rounded-3xl border border-[#4A7C59]/20 bg-[#4A7C59]/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A7C59]">
                      <CheckIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B8F75]">Etapa 2</p>
                      <p className="font-bold text-[#1A1614]">
                        {fmtDateFull(pickedSlot.start)} às {fmtTime(pickedSlot.start)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => resetToStep(2)}
                    className="rounded-xl border border-[#4A7C59]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#4A7C59] hover:bg-[#4A7C59]/5"
                  >
                    Alterar
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-[#1A1614] bg-white p-4 shadow-[0_1px_16px_rgba(44,36,32,0.07)] sm:rounded-3xl sm:p-6">
                <div className="mb-4 flex items-center gap-3 sm:mb-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A1614] text-sm font-black text-white sm:h-10 sm:w-10 sm:text-base">2</div>
                  <div>
                    <p className="text-xs text-[#B0A098]">Etapa 2</p>
                    <p className="font-bold text-[#1A1614]">Data e horário</p>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {/* Calendar */}
                  <div className="rounded-2xl border border-[#E8E0DC] bg-[#FAFAF8] p-4">
                    <CalendarMonth
                      month={month}
                      onMonthChange={setMonth}
                      selected={selectedDay || new Date()}
                      onSelect={selectDay}
                      hasAvailability={hasAvailabilityForDay}
                    />
                  </div>

                  {/* Slots */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#1A1614]">Horários</p>
                        <p className="text-sm text-[#8B7B72]">
                          {selectedDay ? fmtDayTitle(selectedDay) : "Selecione um dia"}
                        </p>
                        <p className="text-xs text-[#B0A098]">
                          Mínimo {MIN_SCHEDULE_LEAD_HOURS}h de antecedência
                        </p>
                      </div>
                      {daySlots.length > 0 && (
                        <span className="rounded-full bg-[#4A7C59]/10 px-3 py-1 text-sm font-bold text-[#4A7C59]">
                          {daySlots.length}
                        </span>
                      )}
                    </div>

                    {loading ? (
                      <SkeletonSlots />
                    ) : !selectedDay ? (
                      <EmptySlots message="Selecione um dia no calendário" />
                    ) : (
                      <SlotsGrid slots={daySlots} onPick={pickSlot} selectedSlot={pickedSlot} />
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <aside className="space-y-4">
          {/* Credits Card — dark */}
          <div className="rounded-3xl bg-[#1A1614] p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Seus Créditos</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-6xl font-black text-white">{credits.available}</span>
              <span className="text-sm text-white/40">{credits.available === 1 ? "sessão" : "sessões"}</span>
            </div>
            <p className="mt-1 text-sm text-white/30">
              {type === "video" ? "Videochamada" : type === "chat" ? "Chat" : "Selecione o tipo"}
            </p>

            {needsCredits && (
              <div className="mt-4 rounded-2xl border border-[#D4A72C]/30 bg-[#D4A72C]/10 p-3">
                <p className="text-sm font-semibold text-[#D4A72C]">
                  Você precisa de créditos para agendar
                </p>
              </div>
            )}

            {/* Mini info */}
            {!needsCredits && credits.available > 0 && (
              <div className="mt-4 space-y-1.5">
                <InfoRow icon="✓" text="Cancelamento gratuito até 24h antes" />
                <InfoRow icon="✓" text="Reagendamento sem custo" />
                <InfoRow icon="✓" text="Sigilo profissional garantido" />
              </div>
            )}
          </div>

          {/* Buy Credits */}
          {needsCredits && type && (
            <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4A72C]/10">
                  <AlertIcon className="h-5 w-5 text-[#D4A72C]" />
                </div>
                <div>
                  <p className="font-bold text-[#1A1614]">Sem créditos</p>
                  <p className="text-xs text-[#8B7B72]">Adquira um pacote para continuar</p>
                </div>
              </div>
              <BuyCreditsSection
                professionalId={professionalId!}
                appointmentType={type}
                onCreditsUpdated={async () => {
                  await loadCreditsBalance(type);
                  await refreshBooked();
                }}
              />
            </div>
          )}

          {/* Resumo da Sessão — step 3 */}
          {pickedSlot && (
            <div className="rounded-3xl border-2 border-[#4A7C59] bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-[#4A7C59]" />
                <p className="font-black uppercase tracking-wide text-[#1A1614]">Resumo da Sessão</p>
              </div>

              <div className="space-y-3">
                {/* Tipo */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#E8E0DC] bg-[#FAFAF8] p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow ${type === "video" ? "bg-[#E8755A]" : "bg-[#5B5EA6]"}`}>
                    {type === "video" ? (
                      <VideoIcon className="h-6 w-6 text-white" />
                    ) : (
                      <ChatBubbleIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1614]">{type === "video" ? "Videochamada" : "Chat por texto"}</p>
                    <p className="text-sm text-[#8B7B72]">
                      {type === "video" ? settings?.session_duration_video_min : settings?.session_duration_chat_min} minutos
                    </p>
                  </div>
                </div>

                {/* Data/Hora */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#E8E0DC] bg-[#FAFAF8] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A7C59] shadow">
                    <CalendarCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1614]">{fmtDateFull(pickedSlot.start)}</p>
                    <p className="text-sm text-[#8B7B72]">{fmtTime(pickedSlot.start)} – {fmtTime(pickedSlot.end)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  onClick={onUseCredit}
                  disabled={confirming || needsCredits}
                  className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-60 ${
                    needsCredits ? "bg-[#B0A098]" : "bg-[#4A7C59] hover:bg-[#3d6649] hover:shadow-xl"
                  }`}
                >
                  {confirming ? (
                    <><LoadingSpinner /><span>Confirmando...</span></>
                  ) : needsCredits ? (
                    <><AlertIcon className="h-5 w-5" /><span>Compre créditos para confirmar</span></>
                  ) : (
                    <><CheckCircleIcon className="h-5 w-5" /><span>Confirmar Sessão</span></>
                  )}
                </button>

                {needsCredits && (
                  <div className="rounded-2xl border border-[#D4A72C]/30 bg-[#D4A72C]/10 p-3">
                    <p className="text-sm font-semibold text-[#D4A72C]">Você está sem créditos.</p>
                    <p className="mt-0.5 text-xs text-[#8B7B72]">Compre um pacote acima e depois confirme este horário.</p>
                  </div>
                )}

                <button
                  onClick={() => resetToStep(2)}
                  className="w-full rounded-2xl border-2 border-[#E8E0DC] px-4 py-3 text-sm font-semibold text-[#2C2420] transition-all hover:bg-[#F5F0ED]"
                >
                  ← Escolher outro horário
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-[#B0A098]">✓ Cancelamento gratuito até 24h antes</p>
            </div>
          )}

          {/* Info quando não tem slot selecionado */}
          {!pickedSlot && !needsCredits && (
            <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
              <p className="font-bold text-[#1A1614]">
                {currentStep === 1 ? "Como funciona" : "Próximo passo"}
              </p>
              <p className="mt-2 text-sm text-[#8B7B72]">
                {currentStep === 1
                  ? "Escolha o tipo de atendimento. Você pode optar por videochamada ou chat por texto."
                  : "Selecione um horário disponível para ver o resumo e confirmar sua sessão."}
              </p>
              <ul className="mt-4 space-y-2">
                <InfoRow icon="✓" text="Cancelamento gratuito até 24h antes" />
                <InfoRow icon="✓" text="Reagendamento sem custo" />
                <InfoRow icon="✓" text="Sigilo profissional garantido" />
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* ===== BARRA FIXA DE CONFIRMAÇÃO (apenas mobile) ===== */}
      {pickedSlot && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8E0DC] bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-[#8B7B72]">
                {type === "video" ? "Videochamada" : "Chat"} • {type === "video" ? settings?.session_duration_video_min : settings?.session_duration_chat_min} min
              </p>
              <p className="truncate text-sm font-bold text-[#1A1614]">
                {fmtDateFull(pickedSlot.start)} às {fmtTime(pickedSlot.start)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => resetToStep(2)}
                className="rounded-xl border-2 border-[#E8E0DC] px-3 py-2.5 text-xs font-semibold text-[#2C2420]"
              >
                Alterar
              </button>
              <button
                onClick={onUseCredit}
                disabled={confirming || needsCredits}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-60 ${
                  needsCredits ? "bg-[#B0A098]" : "bg-[#4A7C59]"
                }`}
              >
                {confirming ? "Confirmando..." : needsCredits ? "Sem créditos" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTS =====

function StepBubble({
  number, label, sublabel, status, onClick, disabled,
}: {
  number: number;
  label: string;
  sublabel: string;
  status: "pending" | "active" | "done";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const canClick = onClick && !disabled && status === "done";
  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={disabled || !canClick}
      className={`flex flex-col items-center gap-2 ${canClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className={`relative flex h-11 w-11 items-center justify-center rounded-full text-base font-black transition-all duration-300 ${
        status === "done"
          ? "bg-[#4A7C59] text-white shadow-lg"
          : status === "active"
            ? "bg-[#1A1614] text-white ring-4 ring-[#4A7C59]/30 shadow-lg"
            : "bg-[#F5F0ED] text-[#B0A098]"
      }`}>
        {status === "done" ? <CheckIcon className="h-5 w-5" /> : <span>{number}</span>}
        {status === "active" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#4A7C59] opacity-20" />
        )}
      </div>
      <div className="text-center">
        <p className={`text-xs font-bold ${status === "pending" ? "text-[#B0A098]" : "text-[#1A1614]"}`}>{label}</p>
        <p className={`hidden text-[10px] sm:block ${status === "pending" ? "text-[#D0C8C0]" : "text-[#8B7B72]"}`}>{sublabel}</p>
      </div>
    </button>
  );
}

function EmptySlots({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E8E0DC] bg-[#FAFAF8] py-10">
      <CalendarIcon className="h-10 w-10 text-[#D0C8C0]" />
      <p className="mt-3 text-sm text-[#B0A098]">{message}</p>
    </div>
  );
}

function SkeletonSlots() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-16 animate-pulse rounded-lg bg-[#F5F0ED]" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-[#F5F0ED]" />
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-white/50">
      <span className="text-[#4A7C59]">{icon}</span>
      {text}
    </div>
  );
}

// Helpers
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function fmtDayTitle(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function fmtDateShort(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmtDateFull(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ===== ICONS =====

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function CalendarPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function CalendarCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 14l2 2 4-4" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
