"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { CalendarMonth } from "@/components/shared/agenda/CalendarMonth";
import { SlotsGrid } from "@/components/shared/agenda/SlotsGrid";
import {
  getProfessional,
  getSettings,
  getRules,
  getBlocks,
  getBookedAppointments,
  getProducts,
  getCreditsBalance,
  generateSlotsForDay,
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
  const [type, setType] = useState<AppointmentType>("video");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [pickedSlot, setPickedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirming, setConfirming] = useState(false);

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

        const prods = await getProducts(prof.id, type);
        setProducts(prods);
        setSelectedProductId(prods[0]?.id ?? null);

        const bal = await getCreditsBalance(prof.id, type);
        setCredits(bal);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Update products when type changes
  useEffect(() => {
    (async () => {
      if (!professionalId) return;

      const prods = await getProducts(professionalId, type);
      setProducts(prods);
      setSelectedProductId(prods[0]?.id ?? null);

      const bal = await getCreditsBalance(professionalId, type);
      setCredits(bal);

      setPickedSlot(null);
    })();
  }, [professionalId, type]);

  // Generate slots for selected day
  const daySlots = useMemo(() => {
    if (!settings) return [];
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
    if (!settings) return false;
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
  function pickSlot(slot: Slot) {
    setPickedSlot(slot);
    setStep(3);
  }

  function resetCheckout() {
    setPickedSlot(null);
    setSelectedProductId(products[0]?.id ?? null);
    setStep(1);
  }

  async function onUseCredit() {
    if (!professionalId || !pickedSlot) return;

    try {
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
      alert(e?.message ?? "Erro ao agendar.");
    } finally {
      setConfirming(false);
    }
  }

  const creditsLabel =
    credits.available > 0
      ? `Você tem ${credits.available} sessão(ões) de ${type === "video" ? "vídeo" : "chat"} disponível(is).`
      : `Você ainda não tem créditos de ${type === "video" ? "vídeo" : "chat"}.`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-400/20 to-sage-500/20">
            <CalendarPlusIcon className="h-6 w-6 text-sage-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-warm-900 sm:text-3xl">
              Agendar sessão
            </h1>
            <p className="text-sm text-muted">
              Escolha o tipo, dia e horário ideal para você
            </p>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        <StepIndicator
          number={1}
          label="Tipo"
          active={step >= 1}
          completed={step > 1}
        />
        <div
          className={`h-0.5 w-12 rounded-full transition-colors duration-300 ${step > 1 ? "bg-sage-500" : "bg-warm-200"}`}
        />
        <StepIndicator
          number={2}
          label="Data"
          active={step >= 2}
          completed={step > 2}
        />
        <div
          className={`h-0.5 w-12 rounded-full transition-colors duration-300 ${step > 2 ? "bg-sage-500" : "bg-warm-200"}`}
        />
        <StepIndicator
          number={3}
          label="Confirmar"
          active={step >= 3}
          completed={false}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Steps */}
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1 - Type */}
          <Card
            title="Tipo de atendimento"
            subtitle="Escolha a modalidade da sua sessão"
            step={1}
            active={step === 1}
            onClick={() => setStep(1)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TypeCard
                type="video"
                selected={type === "video"}
                onClick={() => {
                  setType("video");
                  setStep(2);
                }}
                icon={<VideoIcon className="h-6 w-6" />}
                title="Videochamada"
                description="Sessão ao vivo com vídeo e áudio"
                duration={settings?.session_duration_video_min ?? 50}
              />
              <TypeCard
                type="chat"
                selected={type === "chat"}
                onClick={() => {
                  setType("chat");
                  setStep(2);
                }}
                icon={<ChatIcon className="h-6 w-6" />}
                title="Chat por texto"
                description="Sessão por mensagens em tempo real"
                duration={settings?.session_duration_chat_min ?? 50}
              />
            </div>
          </Card>

          {/* Step 2 - Calendar & Slots */}
          <Card
            title="Escolha a data e horário"
            subtitle={fmtDayTitle(selectedDay)}
            step={2}
            active={step === 2}
            onClick={() => step > 2 && setStep(2)}
            disabled={step < 2}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Calendar */}
              <div className="rounded-2xl border border-warm-300/40 bg-warm-50/50 p-4">
                <CalendarMonth
                  month={month}
                  onMonthChange={setMonth}
                  selected={selectedDay}
                  onSelect={(d) => {
                    setSelectedDay(d);
                    setPickedSlot(null);
                  }}
                  hasAvailability={hasAvailabilityForDay}
                />
              </div>

              {/* Slots */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-warm-900">
                    Horários disponíveis
                  </p>
                  <span className="text-xs text-muted">
                    {daySlots.length} horário(s)
                  </span>
                </div>

                {loading ? (
                  <SkeletonSlots />
                ) : (
                  <SlotsGrid
                    slots={daySlots}
                    onPick={pickSlot}
                    selectedSlot={pickedSlot}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Summary & Actions */}
        <aside className="space-y-4">
          {/* Credits Card */}
          <div className="overflow-hidden rounded-2xl border border-warm-300/50 bg-gradient-to-br from-white/90 to-warm-50/50 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-400/20 to-sage-500/20">
                <CreditCardIcon className="h-5 w-5 text-sage-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-900">
                  Seus créditos
                </p>
                <p className="text-xs text-muted">
                  {type === "video" ? "Videochamada" : "Chat"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-sage-600">
                {credits.available}
              </span>
              <span className="text-sm text-muted">sessão(ões)</span>
            </div>

            {credits.available === 0 && (
              <p className="mt-2 text-xs text-rose-600">
                Adquira um plano para agendar
              </p>
            )}
          </div>

          {/* Session Summary */}
          {pickedSlot && (
            <div className="overflow-hidden rounded-2xl border border-sage-200 bg-gradient-to-br from-sage-50/80 to-white p-5 shadow-soft">
              <div className="flex items-center gap-2 text-sage-700">
                <SparklesIcon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  Resumo da sessão
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft">
                    {type === "video" ? (
                      <VideoIcon className="h-5 w-5 text-rose-500" />
                    ) : (
                      <ChatIcon className="h-5 w-5 text-soft-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-900">
                      {type === "video" ? "Videochamada" : "Chat"}
                    </p>
                    <p className="text-xs text-muted">
                      {type === "video"
                        ? settings?.session_duration_video_min
                        : settings?.session_duration_chat_min}{" "}
                      minutos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft">
                    <CalendarIcon className="h-5 w-5 text-sage-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-900">
                      {fmtDate(pickedSlot.start)}
                    </p>
                    <p className="text-xs text-muted">
                      {fmtTime(pickedSlot.start)} – {fmtTime(pickedSlot.end)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {credits.available > 0 ? (
                  <button
                    onClick={onUseCredit}
                    disabled={confirming}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 px-4 py-3.5 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:brightness-105 disabled:opacity-60"
                  >
                    {confirming ? (
                      <>
                        <LoadingSpinner />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Confirmar usando 1 crédito
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {}}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-warm-500 px-4 py-3.5 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:brightness-105"
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    Adquirir plano
                  </button>
                )}

                <button
                  onClick={resetCheckout}
                  className="w-full rounded-xl border border-warm-300/60 bg-white/80 px-4 py-2.5 text-sm font-medium text-warm-700 transition-all duration-300 hover:bg-white hover:shadow-soft"
                >
                  Trocar horário
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-muted">
                Cancelamento gratuito até 24h antes
              </p>
            </div>
          )}

          {/* Rules Card */}
          {!pickedSlot && (
            <div className="rounded-2xl border border-warm-300/50 bg-white/80 p-5 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-sm font-semibold text-warm-900">
                <InfoIcon className="h-4 w-4 text-muted" />
                Informações
              </p>
              <ul className="mt-3 space-y-2 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-sage-500" />
                  Cancelamento gratuito até 24h antes
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-sage-500" />
                  Reagendamento sem custo adicional
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-sage-500" />
                  Sigilo e ética profissional garantidos
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// Step Indicator
function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
          completed
            ? "bg-sage-500 text-white"
            : active
              ? "bg-sage-500 text-white shadow-soft"
              : "bg-warm-200 text-warm-500"
        }`}
      >
        {completed ? <CheckIcon className="h-4 w-4" /> : number}
      </div>
      <span
        className={`text-xs font-medium ${active ? "text-sage-600" : "text-muted"}`}
      >
        {label}
      </span>
    </div>
  );
}

// Card component
function Card({
  title,
  subtitle,
  step,
  active,
  onClick,
  disabled,
  children,
}: {
  title: string;
  subtitle?: string;
  step: number;
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
        active
          ? "border-sage-300 bg-white/90 shadow-soft-lg"
          : disabled
            ? "border-warm-200 bg-warm-50/50 opacity-60"
            : "border-warm-300/50 bg-white/80 hover:shadow-soft"
      } ${onClick && !disabled ? "cursor-pointer" : ""}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="border-b border-warm-200/50 bg-gradient-to-r from-warm-50/50 to-transparent px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-warm-900">{title}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
            )}
          </div>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              active ? "bg-sage-500 text-white" : "bg-warm-200 text-warm-500"
            }`}
          >
            {step}
          </span>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Type Card
function TypeCard({
  type,
  selected,
  onClick,
  icon,
  title,
  description,
  duration,
}: {
  type: AppointmentType;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  duration: number;
}) {
  const colorClass =
    type === "video"
      ? "from-rose-400/20 to-warm-500/20 text-rose-500"
      : "from-soft-400/20 to-soft-500/20 text-soft-600";

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
        selected
          ? "border-sage-300 bg-sage-50/50 shadow-soft"
          : "border-warm-300/60 bg-white hover:border-sage-200 hover:shadow-soft"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-sage-500 shadow">
          <CheckIcon className="h-3 w-3 text-white" />
        </span>
      )}

      <div
        className={`inline-flex rounded-xl bg-gradient-to-br p-3 ${colorClass}`}
      >
        {icon}
      </div>

      <p className="mt-3 text-base font-semibold text-warm-900">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <ClockIcon className="h-3.5 w-3.5" />
        {duration} minutos
      </div>
    </button>
  );
}

// Skeleton
function SkeletonSlots() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-20 animate-pulse rounded bg-warm-200" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-warm-200" />
        ))}
      </div>
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
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Icons
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
        strokeWidth={1.5}
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
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
        strokeWidth={1.5}
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
        strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
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
        strokeWidth={1.5}
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
        strokeWidth={1.5}
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
        strokeWidth={1.5}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
