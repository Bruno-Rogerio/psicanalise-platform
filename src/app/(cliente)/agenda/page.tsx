"use client";

import { useEffect, useMemo, useState } from "react";
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
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProfessionalSettings | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [booked, setBooked] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
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

  // ✅ helper: quando precisa comprar créditos
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
    return generateSlotsForDay({
      day: selectedDay,
      type,
      rules,
      settings,
      blocks,
      booked,
    });
  }, [professionalId, selectedDay, type, rules, settings, blocks, booked]);

  // Check if day has availability
  const hasAvailabilityForDay = (d: Date) => {
    if (!settings || !type) return false;
    const slots = generateSlotsForDay({
      day: d,
      type,
      rules,
      settings,
      blocks,
      booked,
    });
    return slots.length > 0;
  };

  // Handlers
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

    const a = await getBookedAppointments(
      professionalId,
      from.toISOString(),
      to.toISOString(),
    );

    setBooked(a);
  }

  async function onUseCredit() {
    if (!professionalId || !pickedSlot) return;

    try {
      const minStartMs =
        Date.now() + MIN_SCHEDULE_LEAD_HOURS * 60 * 60 * 1000;
      if (pickedSlot.start.getTime() < minStartMs) {
        alert(
          `Agendamentos precisam de no mínimo ${MIN_SCHEDULE_LEAD_HOURS} horas de antecedência.`,
        );
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

      // ✅ conflito de agenda (alguém pegou antes / overlap)
      if (msg.includes("SLOT_TAKEN")) {
        alert("Esse horário acabou de ser reservado. Escolha outro.");

        await refreshBooked();
        setPickedSlot(null);

        await loadCreditsBalance(pickedSlot.appointment_type);
        return;
      }

      if (msg.includes("NO_CREDITS")) {
        alert("Você não tem créditos disponíveis para agendar.");
        await loadCreditsBalance(pickedSlot.appointment_type);
        return;
      }

      if (msg.includes("NOT_AUTHENTICATED")) {
        alert("Você precisa estar logado.");
        return;
      }

      alert(e?.message ?? "Erro ao agendar.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-lg">
            <CalendarPlusIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900 sm:text-3xl">
              Agendar Sessão
            </h1>
            <p className="mt-1 text-warm-600">
              Siga os passos abaixo para marcar seu horário
            </p>
          </div>
        </div>
      </header>

      {/* ========== PROGRESS BAR ========== */}
      <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <StepBubble
            number={1}
            label="Tipo"
            sublabel={type ? (type === "video" ? "Vídeo" : "Chat") : "Escolha"}
            status={
              currentStep === 1
                ? "active"
                : currentStep > 1
                  ? "done"
                  : "pending"
            }
            onClick={() => resetToStep(1)}
          />

          {/* Connector 1-2 */}
          <div className="relative mx-2 h-1 flex-1">
            <div className="absolute inset-0 rounded-full bg-warm-200" />
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-sage-500 transition-all duration-500 ease-out ${
                currentStep >= 2 ? "w-full" : "w-0"
              }`}
            />
          </div>

          {/* Step 2 */}
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
            status={
              currentStep === 2
                ? "active"
                : currentStep > 2
                  ? "done"
                  : "pending"
            }
            onClick={() => currentStep > 2 && resetToStep(2)}
            disabled={currentStep < 2}
          />

          {/* Connector 2-3 */}
          <div className="relative mx-2 h-1 flex-1">
            <div className="absolute inset-0 rounded-full bg-warm-200" />
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-sage-500 transition-all duration-500 ease-out ${
                currentStep >= 3 ? "w-full" : "w-0"
              }`}
            />
          </div>

          {/* Step 3 */}
          <StepBubble
            number={3}
            label="Confirmar"
            sublabel={pickedSlot ? "Pronto!" : "Aguardando"}
            status={currentStep === 3 ? "active" : "pending"}
            disabled={currentStep < 3}
          />
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* ===== STEP 1: TIPO ===== */}
          <StepCard
            stepNumber={1}
            title="Escolha o tipo de atendimento"
            isActive={currentStep === 1}
            isCompleted={currentStep > 1}
            selectedValue={
              type
                ? type === "video"
                  ? "Videochamada"
                  : "Chat por texto"
                : null
            }
            onEdit={() => resetToStep(1)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Video Option */}
              <OptionCard
                selected={type === "video"}
                onClick={() => selectType("video")}
                icon={<VideoIcon className="h-7 w-7 text-white" />}
                iconBg="bg-gradient-to-br from-rose-400 to-rose-500"
                title="Videochamada"
                description="Sessão ao vivo com câmera e áudio"
                badge={`${settings?.session_duration_video_min ?? 50} min`}
              />

              {/* Chat Option */}
              <OptionCard
                selected={type === "chat"}
                onClick={() => selectType("chat")}
                icon={<ChatBubbleIcon className="h-7 w-7 text-white" />}
                iconBg="bg-gradient-to-br from-indigo-400 to-indigo-500"
                title="Chat por texto"
                description="Mensagens em tempo real"
                badge={`${settings?.session_duration_chat_min ?? 50} min`}
              />
            </div>
          </StepCard>

          {/* ===== STEP 2: DATA E HORÁRIO ===== */}
          {currentStep >= 2 && (
            <StepCard
              stepNumber={2}
              title="Escolha a data e horário"
              isActive={currentStep === 2}
              isCompleted={currentStep > 2}
              selectedValue={
                pickedSlot
                  ? `${fmtDateFull(pickedSlot.start)} às ${fmtTime(
                      pickedSlot.start,
                    )}`
                  : null
              }
              onEdit={() => resetToStep(2)}
            >
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Calendar */}
                <div className="rounded-2xl border border-warm-200 bg-warm-50/50 p-4">
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
                      <p className="font-semibold text-warm-900">Horários</p>
                      <p className="text-sm text-warm-500">
                        {selectedDay
                          ? fmtDayTitle(selectedDay)
                          : "Selecione um dia"}
                      </p>
                      <p className="text-xs text-warm-400">
                        Agendamentos com no mínimo {MIN_SCHEDULE_LEAD_HOURS}h de antecedência.
                      </p>
                    </div>
                    {daySlots.length > 0 && (
                      <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-sage-700">
                        {daySlots.length} disponíveis
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <SkeletonSlots />
                  ) : !selectedDay ? (
                    <EmptySlots message="Selecione um dia no calendário" />
                  ) : (
                    <SlotsGrid
                      slots={daySlots}
                      onPick={pickSlot}
                      selectedSlot={pickedSlot}
                    />
                  )}
                </div>
              </div>
            </StepCard>
          )}
        </div>

        {/* ===== RIGHT COLUMN - RESUMO ===== */}
        <aside className="space-y-4">
          {/* Créditos */}
          <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow">
                <CreditIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-warm-900">Seus Créditos</p>
                <p className="text-sm text-warm-500">
                  {type === "video"
                    ? "Videochamada"
                    : type === "chat"
                      ? "Chat"
                      : "Selecione o tipo"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-sage-600">
                  {credits.available}
                </span>
                <span className="text-warm-500">sessão(ões)</span>
              </div>

              {needsCredits && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm font-medium text-amber-800">
                    ⚠️ Você precisa de créditos para agendar
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Compra de créditos aparece UMA vez só (sem duplicar no resumo) */}
          {needsCredits && type && (
            <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                  <AlertIcon className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-warm-900">Sem créditos</p>
                  <p className="text-xs text-warm-600">
                    Adquira um pacote para continuar
                  </p>
                </div>
              </div>

              <BuyCreditsSection
                professionalId={professionalId!}
                appointmentType={type}
                onCreditsUpdated={async () => {
                  await loadCreditsBalance(type);
                  // opcional: recarrega agenda (se sua compra liberar algo no fluxo)
                  await refreshBooked();
                }}
              />
            </div>
          )}

          {/* Resumo da Sessão - aparece no step 3 */}
          {pickedSlot && (
            <div className="rounded-2xl border-2 border-sage-400 bg-white p-5 shadow-lg">
              <div className="flex items-center gap-2 text-sage-700">
                <SparklesIcon className="h-5 w-5" />
                <p className="font-bold uppercase tracking-wide">
                  Resumo da Sessão
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {/* Tipo */}
                <div className="flex items-center gap-4 rounded-xl bg-warm-50 border border-warm-200 p-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl shadow ${
                      type === "video"
                        ? "bg-gradient-to-br from-rose-400 to-rose-500"
                        : "bg-gradient-to-br from-indigo-400 to-indigo-500"
                    }`}
                  >
                    {type === "video" ? (
                      <VideoIcon className="h-6 w-6 text-white" />
                    ) : (
                      <ChatBubbleIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-warm-900">
                      {type === "video" ? "Videochamada" : "Chat por texto"}
                    </p>
                    <p className="text-sm text-warm-600">
                      {type === "video"
                        ? settings?.session_duration_video_min
                        : settings?.session_duration_chat_min}{" "}
                      minutos de duração
                    </p>
                  </div>
                </div>

                {/* Data/Hora */}
                <div className="flex items-center gap-4 rounded-xl bg-warm-50 border border-warm-200 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sage-400 to-sage-500 shadow">
                    <CalendarCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-warm-900">
                      {fmtDateFull(pickedSlot.start)}
                    </p>
                    <p className="text-sm text-warm-600">
                      {fmtTime(pickedSlot.start)} – {fmtTime(pickedSlot.end)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-6 space-y-3">
                {/* ✅ aqui NÃO duplica mais compra; só confirma (ou explica que precisa comprar acima) */}
                <button
                  onClick={onUseCredit}
                  disabled={confirming || needsCredits}
                  className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-60 ${
                    needsCredits
                      ? "bg-warm-400"
                      : "bg-[#4A7C59] hover:bg-[#3d6649] hover:shadow-xl"
                  }`}
                >
                  {confirming ? (
                    <>
                      <LoadingSpinner />
                      <span>Confirmando...</span>
                    </>
                  ) : needsCredits ? (
                    <>
                      <AlertIcon className="h-6 w-6" />
                      <span>Compre créditos para confirmar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-6 w-6" />
                      <span>Confirmar Sessão</span>
                    </>
                  )}
                </button>

                {needsCredits && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Você está sem créditos.
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Compre um pacote acima e depois confirme este horário.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => resetToStep(2)}
                  className="w-full rounded-xl border-2 border-warm-300 bg-warm-50 px-4 py-3 font-semibold text-warm-700 transition-all duration-300 hover:bg-warm-100"
                >
                  ← Escolher outro horário
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-warm-500">
                ✓ Cancelamento gratuito até 24h antes
              </p>
            </div>
          )}

          {/* Info quando não tem slot selecionado */}
          {!pickedSlot && (
            <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-warm-900">
                {currentStep === 1 ? "Como funciona" : "Próximo passo"}
              </p>
              <p className="mt-2 text-sm text-warm-600">
                {currentStep === 1
                  ? "Escolha o tipo de atendimento que prefere. Você pode optar por videochamada ou chat por texto."
                  : "Selecione um horário disponível para ver o resumo e confirmar sua sessão."}
              </p>

              <ul className="mt-4 space-y-2">
                <InfoItem icon="✓" text="Cancelamento gratuito até 24h antes" />
                <InfoItem icon="✓" text="Reagendamento sem custo" />
                <InfoItem icon="✓" text="Sigilo profissional garantido" />
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ========== COMPONENTES ==========

// Step Bubble no progress bar
function StepBubble({
  number,
  label,
  sublabel,
  status,
  onClick,
  disabled,
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
      className={`flex flex-col items-center gap-2 ${
        canClick ? "cursor-pointer" : "cursor-default"
      }`}
    >
      {/* Círculo */}
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-all duration-300 ${
          status === "done"
            ? "bg-sage-500 text-white shadow-lg shadow-sage-500/30"
            : status === "active"
              ? "bg-sage-100 text-sage-700 ring-4 ring-sage-500 shadow-lg"
              : "bg-warm-100 text-warm-400"
        }`}
      >
        {status === "done" ? (
          <CheckIcon className="h-6 w-6" />
        ) : (
          <span>{number}</span>
        )}

        {/* Pulse animation for active */}
        {status === "active" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-sage-400 opacity-20" />
        )}
      </div>

      {/* Labels */}
      <div className="text-center">
        <p
          className={`text-sm font-semibold ${
            status === "pending" ? "text-warm-400" : "text-warm-900"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-xs ${
            status === "pending" ? "text-warm-300" : "text-warm-500"
          }`}
        >
          {sublabel}
        </p>
      </div>
    </button>
  );
}

// Step Card
function StepCard({
  stepNumber,
  title,
  isActive,
  isCompleted,
  selectedValue,
  onEdit,
  children,
}: {
  stepNumber: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  selectedValue: string | null;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  // Se completado, mostra versão compacta
  if (isCompleted && selectedValue) {
    return (
      <div className="rounded-2xl border border-sage-200 bg-sage-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-500 text-white shadow">
              <CheckIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-warm-500">Etapa {stepNumber}</p>
              <p className="font-semibold text-warm-900">{selectedValue}</p>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="rounded-lg bg-white border border-sage-200 px-4 py-2 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-100"
          >
            Alterar
          </button>
        </div>
      </div>
    );
  }

  // Versão expandida
  return (
    <div
      className={`rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-300 ${
        isActive ? "border-sage-400 shadow-lg" : "border-warm-200"
      }`}
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold ${
            isActive
              ? "bg-sage-100 text-sage-700 ring-2 ring-sage-500"
              : "bg-warm-100 text-warm-400"
          }`}
        >
          {stepNumber}
        </div>
        <div>
          <p className="text-sm text-warm-500">Etapa {stepNumber}</p>
          <p className="text-lg font-semibold text-warm-900">{title}</p>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

// Option Card (para tipo de atendimento)
function OptionCard({
  selected,
  onClick,
  icon,
  iconBg,
  title,
  description,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
        selected
          ? "border-sage-500 bg-sage-50 shadow-lg ring-2 ring-sage-500 ring-offset-2"
          : "border-warm-200 bg-white hover:border-sage-300 hover:shadow-md"
      }`}
    >
      {/* Selected indicator */}
      {selected && (
        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-sage-500 shadow">
          <CheckIcon className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Icon */}
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconBg} shadow-lg transition-transform duration-300 group-hover:scale-105`}
      >
        {icon}
      </div>

      {/* Content */}
      <p className="mt-4 text-lg font-bold text-warm-900">{title}</p>
      <p className="mt-1 text-sm text-warm-500">{description}</p>

      {/* Badge */}
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warm-100 px-3 py-1 text-sm font-medium text-warm-700">
        <ClockIcon className="h-4 w-4" />
        {badge}
      </div>
    </button>
  );
}

// Empty Slots
function EmptySlots({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-warm-200 bg-warm-50 py-12">
      <CalendarIcon className="h-12 w-12 text-warm-300" />
      <p className="mt-4 text-warm-500">{message}</p>
    </div>
  );
}

// Skeleton
function SkeletonSlots() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-20 animate-pulse rounded-lg bg-warm-200" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-warm-200" />
        ))}
      </div>
    </div>
  );
}

// Info Item
function InfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-warm-600">
      <span className="text-sage-500">{icon}</span>
      {text}
    </li>
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
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function fmtDateShort(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function fmtDateFull(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ========== ICONS ==========

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

function CalendarPlusIcon({ className }: { className?: string }) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 11v6m-3-3h6"
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

function CalendarCheckIcon({ className }: { className?: string }) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M9 14l2 2 4-4"
      />
    </svg>
  );
}

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

function CreditIcon({ className }: { className?: string }) {
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
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
        strokeWidth={3}
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

function LoadingSpinner() {
  return (
    <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
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

