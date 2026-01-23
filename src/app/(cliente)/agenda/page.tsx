"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppointmentType,
  AvailabilityBlock,
  AvailabilityRule,
  Appointment,
  Product,
  ProfessionalSettings,
  Slot,
  generateSlotsForDay,
  getBlocks,
  getBookedAppointments,
  getProfessional,
  getProducts,
  getRules,
  getSettings,
  getCreditsBalance,
} from "@/services/agenda";
import { supabase } from "@/lib/supabase-browser";
import { CalendarMonth } from "@/components/shared/agenda/CalendarMonth";
import { TypeToggle } from "@/components/shared/agenda/TypeToggle";
import { SlotsGrid } from "@/components/shared/agenda/SlotsGrid";
import { SessionSummary } from "@/components/shared/agenda/SessionSummary";
import { PlanSelector } from "@/components/shared/agenda/PlanSelector";
import { PaymentActions } from "@/components/shared/agenda/PaymentActions";

export default function AgendaClientePage() {
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<AppointmentType>("video");

  const [credits, setCredits] = useState<{
    total: number;
    used: number;
    available: number;
  }>({ total: 0, used: 0, available: 0 });

  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProfessionalSettings | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [booked, setBooked] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedDay, setSelectedDay] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [month, setMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const [pickedSlot, setPickedSlot] = useState<Slot | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId],
  );

  const daySlots = useMemo(() => {
    if (!settings || !professionalId) return [];
    return generateSlotsForDay({
      day: selectedDay,
      type,
      rules,
      settings,
      blocks,
      booked,
    });
  }, [settings, professionalId, selectedDay, type, rules, blocks, booked]);

  const availabilityForDay = useMemo(() => {
    if (!settings) return false;
    const slots = generateSlotsForDay({
      day: selectedDay,
      type,
      rules,
      settings,
      blocks,
      booked,
    });
    return slots.length > 0;
  }, [selectedDay, type, rules, settings, blocks, booked]);

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

        const fromISO = from.toISOString();
        const toISO = to.toISOString();

        const [b, a] = await Promise.all([
          getBlocks(prof.id, fromISO, toISO),
          getBookedAppointments(prof.id, fromISO, toISO),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function pickSlot(slot: Slot) {
    setPickedSlot(slot);
  }

  function resetCheckout() {
    setPickedSlot(null);
    setSelectedProductId(products[0]?.id ?? null);
  }

  async function createAppointmentWithCredit() {
    if (!professionalId || !pickedSlot)
      throw new Error("Selecione um horário.");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id)
      throw new Error("Você precisa estar logado para agendar.");

    const payload = {
      p_prof: professionalId,
      p_type: pickedSlot.appointment_type, // 'video' | 'chat'
      p_start: pickedSlot.start.toISOString(),
      p_end: pickedSlot.end.toISOString(),
    };

    const { data, error } = await supabase.rpc("book_with_credit", payload);

    if (error) {
      console.error("RPC book_with_credit error:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
        payload,
      });

      const msg = error.message || "Erro ao agendar.";
      if (msg.includes("NO_CREDITS"))
        throw new Error("Sem créditos. Escolha um plano para comprar.");
      if (msg.includes("SLOT_TAKEN"))
        throw new Error("Esse horário acabou de ser reservado. Escolha outro.");
      throw new Error(msg);
    }

    if (!data) {
      console.error("RPC book_with_credit retornou data vazia.", { payload });
      throw new Error("Falha ao confirmar agendamento. Tente novamente.");
    }

    setBooked((prev) => [
      ...prev,
      {
        id: String(data),
        profissional_id: professionalId,
        start_at: pickedSlot.start.toISOString(),
        end_at: pickedSlot.end.toISOString(),
        status: "scheduled",
        appointment_type: pickedSlot.appointment_type,
      },
    ]);

    const bal = await getCreditsBalance(professionalId, type);
    setCredits(bal);

    return data;
  }

  async function onUseCredit() {
    try {
      await createAppointmentWithCredit();
      resetCheckout();
      alert("Agendado e crédito consumido ✅");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erro ao agendar.");
    }
  }

  // Placeholder: por enquanto seus botões “pagar” apenas consomem crédito
  // (na próxima etapa vamos integrar order + stripe/pix)
  async function onPayCard() {
    await createAppointmentWithCredit();
    resetCheckout();
    alert("Agendado e crédito consumido ✅");
  }

  async function onPayPix() {
    await createAppointmentWithCredit();
    resetCheckout();
    alert("Agendado e crédito consumido ✅");
  }

  const creditsLabel = useMemo(() => {
    const label = type === "video" ? "vídeo" : "chat";
    if (credits.available > 0)
      return `Você tem ${credits.available} sessão(ões) de ${label} disponível(is).`;
    return `Sem créditos para ${label}. Escolha um plano para continuar.`;
  }, [credits.available, type]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
          Agende sua sessão
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5F6B64] sm:text-base">
          Primeiro escolha um horário que faça sentido para você. O pagamento
          vem depois.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">
              1) Tipo de atendimento
            </p>
            <p className="mt-1 text-xs text-[#5F6B64]">
              Escolha a modalidade. Ética e sigilo em todas as sessões.
            </p>
            <div className="mt-3">
              <TypeToggle value={type} onChange={setType} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#111111]">
                  2) Selecione um dia
                </p>
                <p className="mt-1 text-xs text-[#5F6B64]">
                  Dias com ponto indicam disponibilidade.
                </p>
              </div>
              <div className="text-xs font-semibold text-[#5F6B64]">
                {fmtDayTitle(selectedDay)}
              </div>
            </div>

            <div className="mt-3">
              <CalendarMonth
                month={month}
                onMonthChange={setMonth}
                selected={selectedDay}
                onSelect={setSelectedDay}
                hasAvailability={(d) => {
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
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#111111]">
                  3) Escolha um horário
                </p>
                <p className="mt-1 text-xs text-[#5F6B64]">
                  Toque em um horário para continuar.
                </p>
              </div>
              <div className="text-xs font-semibold text-[#5F6B64]">
                {availabilityForDay ? "Disponível" : "Sem horários neste dia"}
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <SkeletonSlots />
              ) : (
                <SlotsGrid slots={daySlots} onPick={pickSlot} />
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">Regras</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5F6B64]">
              Cancelamento com reembolso até 24h antes. Menos que isso, apenas
              reagendamento.
            </p>
          </div>

          {/* ✅ NOVO: Créditos (parte 2.3) */}
          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">
              Seus créditos
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#5F6B64]">
              {creditsLabel}
            </p>
          </div>

          {pickedSlot ? (
            <div className="space-y-4">
              <SessionSummary slot={pickedSlot} />

              {/* ✅ Se tem créditos: mostra CTA de confirmar usando 1 sessão */}
              {credits.available > 0 ? (
                <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
                  <button
                    onClick={onUseCredit}
                    className="w-full rounded-xl bg-[#111111] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Confirmar usando 1 sessão
                  </button>

                  <p className="mt-2 text-xs leading-relaxed text-[#5F6B64]">
                    Ao confirmar, sua sessão é agendada e 1 crédito é consumido.
                    Se não comparecer, a sessão é considerada realizada.
                  </p>
                </div>
              ) : (
                <>
                  {/* ✅ Sem créditos: mostra planos e pagamento */}
                  <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
                    <PlanSelector
                      products={products}
                      selectedId={selectedProductId}
                      onSelect={setSelectedProductId}
                    />
                  </div>

                  <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
                    <PaymentActions
                      disabled={!selectedProductId}
                      onCard={onPayCard}
                      onPix={onPayPix}
                    />
                    <p className="mt-2 text-xs leading-relaxed text-[#5F6B64]">
                      O horário será confirmado após o pagamento.
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={resetCheckout}
                className="w-full rounded-xl border border-[#D6DED9] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-white/80"
              >
                Trocar horário
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-[#111111]">
                Próximo passo
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#5F6B64]">
                Selecione um horário para ver o resumo da sessão e seguir com o
                agendamento. Se você tiver créditos, poderá confirmar na hora.
                Se não tiver, poderá escolher um plano e pagar.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SkeletonSlots() {
  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-3 backdrop-blur">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-xl border border-[#D6DED9] bg-white/80"
          />
        ))}
      </div>
    </div>
  );
}

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
    month: "short",
  });
}
