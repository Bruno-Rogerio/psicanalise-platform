"use client";

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { CalendarMonth } from "@/components/shared/agenda/CalendarMonth";
import {
  getBlocks,
  getBookedAppointments,
  getRules,
  getSettings,
  generateSlotsForDayWithStatus,
  type Appointment as BookedAppointment,
  type AppointmentType,
  type AvailabilityBlock,
  type AvailabilityRule,
  type ProfessionalSettings,
  type SlotWithStatus,
} from "@/services/agenda";

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";

type Appointment = {
  id: string;
  user_id: string;
  appointment_type: "video" | "chat";
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  patient: { id: string; nome: string } | null;
};

export default function ProfissionalAgendaPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [busy, setBusy] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProfessionalSettings | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [booked, setBooked] = useState<BookedAppointment[]>([]);
  const [slotType, setSlotType] = useState<AppointmentType>("video");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, SlotWithStatus>>({});
  const [bulkBusy, setBulkBusy] = useState<"block" | "unblock" | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) return;
        setProfessionalId(auth.user.id);
        const { data, error } = await supabase
          .from("appointments")
          .select(`id, user_id, appointment_type, status, start_at, end_at,
            patient:profiles!appointments_user_id_fkey ( id, nome )`)
          .eq("profissional_id", auth.user.id)
          .order("start_at", { ascending: true });
        if (!error && data)
          setAppointments(data.map((a: any) => ({ ...a, patient: a.patient?.[0] ?? null })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!professionalId) return;
    (async () => {
      try {
        const [s, r] = await Promise.all([getSettings(professionalId), getRules(professionalId)]);
        setSettings(s);
        setRules(r);
      } catch {}
    })();
  }, [professionalId]);

  useEffect(() => {
    if (!professionalId || !selectedDay) return;
    (async () => {
      setSlotsLoading(true);
      try {
        const from = startOfDay(selectedDay);
        const to = endOfDay(selectedDay);
        const [b, a] = await Promise.all([
          getBlocks(professionalId, from.toISOString(), to.toISOString()),
          getBookedAppointments(professionalId, from.toISOString(), to.toISOString()),
        ]);
        setBlocks(b);
        setBooked(a);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [professionalId, selectedDay]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const k = new Date(a.start_at).toDateString();
      map.set(k, [...(map.get(k) ?? []), a]);
    }
    return map;
  }, [appointments]);

  const selectedSessions = useMemo(() => {
    const list = sessionsByDay.get(selectedDay.toDateString()) ?? [];
    return [...list].sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
  }, [selectedDay, sessionsByDay]);

  const hasSessions = (d: Date) => (sessionsByDay.get(d.toDateString())?.length ?? 0) > 0;

  const stats = useMemo(() => ({
    scheduled: selectedSessions.filter((s) => s.status === "scheduled").length,
    completed: selectedSessions.filter((s) => s.status === "completed").length,
    cancelled: selectedSessions.filter((s) => s.status === "cancelled").length,
    total: selectedSessions.length,
  }), [selectedSessions]);

  const daySlots = useMemo(() => {
    if (!settings || !selectedDay) return [];
    return generateSlotsForDayWithStatus({ day: selectedDay, type: slotType, rules, settings, blocks, booked });
  }, [settings, selectedDay, slotType, rules, blocks, booked]);

  useEffect(() => { setSelectedSlots({}); }, [selectedDay, slotType]);

  useEffect(() => {
    setSelectedSlots((prev) => {
      const next: Record<string, SlotWithStatus> = {};
      const map = new Map(daySlots.map((s) => [slotKey(s), s]));
      for (const key of Object.keys(prev)) {
        const slot = map.get(key);
        if (!slot || slot.status === "booked" || slot.status === "past") continue;
        next[key] = slot;
      }
      return next;
    });
  }, [daySlots]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    try {
      setBusy(id);
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (e: any) {
      toast(e?.message ?? "Erro ao atualizar.", "error");
    } finally {
      setBusy(null);
    }
  }

  function toggleSelection(slot: SlotWithStatus) {
    if (!professionalId || slot.status === "booked" || slot.status === "past") return;
    const key = slotKey(slot);
    setSelectedSlots((prev) => {
      if (prev[key]) { const next = { ...prev }; delete next[key]; return next; }
      return { ...prev, [key]: slot };
    });
  }

  async function blockSelected() {
    if (!professionalId) return;
    const toBlock = Object.values(selectedSlots).filter((s) => s.status === "available");
    if (!toBlock.length) return;
    try {
      setBulkBusy("block");
      const payload = toBlock.map((slot) => ({
        profissional_id: professionalId,
        start_at: slot.start.toISOString(),
        end_at: slot.end.toISOString(),
      }));
      const { data, error } = await supabase
        .from("availability_blocks").insert(payload).select("id,profissional_id,start_at,end_at");
      if (error) throw error;
      if (data?.length) setBlocks((prev) => [...prev, ...(data as AvailabilityBlock[])]);
      setSelectedSlots({});
    } catch (e: any) {
      toast(e?.message ?? "Erro ao bloquear horários.", "error");
    } finally {
      setBulkBusy(null);
    }
  }

  async function unblockSelected() {
    if (!professionalId) return;
    const selectedBlocked = Object.values(selectedSlots).filter((s) => s.status === "blocked");
    if (!selectedBlocked.length) return;
    const blockKeyToId = new Map(blocks.map((b) => [blockKey(b), b.id]));
    const idsToDelete = selectedBlocked.map((slot) => blockKeyToId.get(slotKey(slot))).filter(Boolean) as string[];
    if (!idsToDelete.length) { setSelectedSlots({}); return; }
    try {
      setBulkBusy("unblock");
      const { error } = await supabase.from("availability_blocks").delete().in("id", idsToDelete);
      if (error) throw error;
      setBlocks((prev) => prev.filter((b) => !idsToDelete.includes(b.id)));
      setSelectedSlots({});
    } catch (e: any) {
      toast(e?.message ?? "Erro ao desbloquear horários.", "error");
    } finally {
      setBulkBusy(null);
    }
  }

  function goToDay(offset: number) {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + offset);
    setSelectedDay(d);
    setMonth(d);
  }

  const isToday = selectedDay.toDateString() === new Date().toDateString();
  const selectedCount = Object.keys(selectedSlots).length;
  const canBlock = Object.values(selectedSlots).some((s) => s.status === "available");
  const canUnblock = Object.values(selectedSlots).some((s) => s.status === "blocked");

  async function refreshAppointments(profId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select(`id, user_id, appointment_type, status, start_at, end_at,
        patient:profiles!appointments_user_id_fkey ( id, nome )`)
      .eq("profissional_id", profId)
      .order("start_at", { ascending: true });
    if (!error && data)
      setAppointments(data.map((a: any) => ({ ...a, patient: a.patient?.[0] ?? null })));
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Profissional</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">Agenda</h1>
          <p className="mt-1 text-sm text-[#8B7B72]">Gerencie sessões e disponibilidade</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewSession(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1A1614] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2A2320]"
          >
            <PlusIcon className="h-4 w-4" />
            Nova Sessão
          </button>
          <Link
            href="/profissional/configuracoes"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2420] transition-all hover:bg-[#F8F4F1]"
          >
            <SettingsIcon className="h-4 w-4 text-[#8B7B72]" />
            Configurar disponibilidade
          </Link>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Calendar */}
          <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
            <CalendarMonth
              month={month}
              onMonthChange={setMonth}
              selected={selectedDay}
              onSelect={(d) => { setSelectedDay(d); setMonth(d); }}
              hasAvailability={hasSessions}
            />
          </div>

          {/* Day stats — dark card */}
          <div className="overflow-hidden rounded-3xl bg-[#1A1614]">
            <div className="px-5 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                {selectedDay.toLocaleDateString("pt-BR", { weekday: "long" })}
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {selectedDay.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-white/5">
              {[
                { label: "Agend.", value: stats.scheduled, color: "text-amber-400" },
                { label: "Realiz.", value: stats.completed, color: "text-emerald-400" },
                { label: "Cancl.", value: stats.cancelled, color: "text-rose-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-4 pb-5 pt-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/30">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Slot legend */}
          <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white px-5 py-4 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Legenda</p>
            <div className="space-y-2">
              <LegendPill color="border-[#4A7C59]/50 bg-white text-[#4A7C59]" label="Disponível" />
              <LegendPill color="border-[#E8E0DC] bg-[#F8F4F1] text-[#C4B8AE] line-through" label="Bloqueado" />
              <LegendPill color="border-amber-200 bg-amber-50 text-amber-700" label="Agendado" />
              <LegendPill color="border-[#F0EAE6] bg-[#F8F4F1] text-[#D4CCC8]" label="Passado" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Day navigator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToDay(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8E0DC] bg-white text-[#8B7B72] transition-all hover:bg-[#F8F4F1]"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-[#2C2420] capitalize sm:text-2xl">
                {selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </h2>
            </div>
            {!isToday && (
              <button
                onClick={() => { const t = new Date(); setSelectedDay(t); setMonth(t); }}
                className="rounded-2xl border border-[#4A7C59]/30 bg-emerald-50 px-4 py-2 text-xs font-semibold text-[#4A7C59] transition-all hover:bg-emerald-100"
              >
                Hoje
              </button>
            )}
            <button
              onClick={() => goToDay(1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8E0DC] bg-white text-[#8B7B72] transition-all hover:bg-[#F8F4F1]"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Sessions */}
          <div className="overflow-hidden rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
            <div className="flex items-center justify-between border-b border-[#F0EAE6] px-6 py-4">
              <div>
                <p className="text-sm font-bold text-[#2C2420]">Sessões do dia</p>
                <p className="text-xs text-[#B0A098]">
                  {stats.total > 0 ? `${stats.total} sessão${stats.total !== 1 ? "ões" : ""}` : "Nenhuma sessão"}
                </p>
              </div>
              {isToday && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Hoje
                </span>
              )}
            </div>
            <div className="divide-y divide-[#F5F0ED]">
              {loading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#F5F0ED]" />
                  ))}
                </div>
              ) : selectedSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F8F4F1]">
                    <CalendarIcon className="h-8 w-8 text-[#C4B8AE]" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-[#2C2420]">Nenhuma sessão neste dia</p>
                  <p className="mt-1 text-xs text-[#B0A098]">Selecione outro dia no calendário.</p>
                </div>
              ) : (
                selectedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    busy={busy === session.id}
                    onComplete={() => updateStatus(session.id, "completed")}
                    onCancel={() => updateStatus(session.id, "cancelled")}
                  />
                ))
              )}
            </div>
          </div>

          {/* Availability slots */}
          <div className="overflow-hidden rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EAE6] px-6 py-4">
              <div>
                <p className="text-sm font-bold text-[#2C2420]">Disponibilidade</p>
                <p className="text-xs text-[#B0A098]">Selecione e bloqueie ou libere horários</p>
              </div>
              <div className="flex rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-1">
                <button
                  onClick={() => setSlotType("video")}
                  className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
                    slotType === "video" ? "bg-[#E8755A] text-white shadow-sm" : "text-[#8B7B72] hover:text-[#2C2420]"
                  }`}
                >
                  Vídeo
                </button>
                <button
                  onClick={() => setSlotType("chat")}
                  className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
                    slotType === "chat" ? "bg-[#5B5EA6] text-white shadow-sm" : "text-[#8B7B72] hover:text-[#2C2420]"
                  }`}
                >
                  Chat
                </button>
              </div>
            </div>

            {/* Bulk actions bar */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-3 border-b border-[#F0EAE6] bg-[#FAFAF8] px-6 py-3">
                <span className="rounded-full bg-[#1A1614] px-2.5 py-0.5 text-xs font-bold text-white">
                  {selectedCount}
                </span>
                <span className="text-xs text-[#8B7B72]">
                  horário{selectedCount !== 1 ? "s" : ""} selecionado{selectedCount !== 1 ? "s" : ""}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={blockSelected}
                    disabled={bulkBusy !== null || !canBlock}
                    className="rounded-xl bg-[#1A1614] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#2A2320] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bulkBusy === "block" ? "Bloqueando..." : "Bloquear"}
                  </button>
                  <button
                    onClick={unblockSelected}
                    disabled={bulkBusy !== null || !canUnblock}
                    className="rounded-xl border border-[#E8E0DC] bg-white px-4 py-1.5 text-xs font-semibold text-[#2C2420] transition-all hover:bg-[#F8F4F1] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bulkBusy === "unblock" ? "Liberando..." : "Liberar"}
                  </button>
                  <button onClick={() => setSelectedSlots({})} className="px-2 text-xs text-[#B0A098] hover:text-[#8B7B72]">
                    Limpar
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              {slotsLoading ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-[#F5F0ED]" />
                  ))}
                </div>
              ) : (
                <SlotsGrid slots={daySlots} onSelect={toggleSelection} selectedKeys={new Set(Object.keys(selectedSlots))} />
              )}
            </div>
          </div>
        </div>
      </div>

      {showNewSession && professionalId && (
        <NovaSessionModal
          defaultDate={selectedDay}
          onClose={() => setShowNewSession(false)}
          onCreated={() => {
            setShowNewSession(false);
            refreshAppointments(professionalId);
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

/* ─── NOVA SESSION MODAL ─── */
function NovaSessionModal({
  defaultDate,
  onClose,
  onCreated,
  toast,
}: {
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
  toast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const toDateValue = (d: Date) => d.toISOString().slice(0, 10);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(toDateValue(defaultDate));
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(50);
  const [type, setType] = useState<"video" | "chat">("video");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast("Nome e e-mail são obrigatórios", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/profissional/criar-sessao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, phone, date, time, duration, type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar sessão");

      if (data.emailSent === false) {
        toast(
          "Sessão criada! Porém o e-mail não foi enviado — informe os dados de acesso manualmente.",
          "error",
        );
      } else {
        toast(
          data.isNewPatient
            ? "Sessão criada e e-mail com acesso enviado ao paciente!"
            : "Sessão criada e paciente notificado por e-mail!",
          "success",
        );
      }
      onCreated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar sessão";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EAE6] px-6 py-5">
          <div>
            <p className="text-base font-bold text-[#2C2420]">Nova Sessão</p>
            <p className="text-xs text-[#8B7B72]">O paciente receberá os dados de acesso por e-mail</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B7B72] hover:bg-[#F8F4F1] hover:text-[#2C2420]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Seção Paciente */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Paciente</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C2420]">Nome completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Nome do paciente"
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C2420]">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@exemplo.com"
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C2420]">Telefone <span className="font-normal text-[#B0A098]">(opcional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#F0EAE6]" />

          {/* Seção Sessão */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Sessão</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C2420]">Data *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm text-[#2C2420] outline-none transition-all focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C2420]">Horário *</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm text-[#2C2420] outline-none transition-all focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C2420]">Duração (min) *</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 50)}
                  min={10}
                  max={480}
                  required
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm text-[#2C2420] outline-none transition-all focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C2420]">Tipo *</label>
                <div className="flex h-[42px] rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-1">
                  <button
                    type="button"
                    onClick={() => setType("video")}
                    className={`flex-1 rounded-xl text-xs font-semibold transition-all ${
                      type === "video" ? "bg-[#E8755A] text-white shadow-sm" : "text-[#8B7B72] hover:text-[#2C2420]"
                    }`}
                  >
                    Vídeo
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("chat")}
                    className={`flex-1 rounded-xl text-xs font-semibold transition-all ${
                      type === "chat" ? "bg-[#5B5EA6] text-white shadow-sm" : "text-[#8B7B72] hover:text-[#2C2420]"
                    }`}
                  >
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[#E8E0DC] py-2.5 text-sm font-semibold text-[#8B7B72] transition-all hover:bg-[#F8F4F1]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-[#1A1614] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2A2320] disabled:opacity-50"
            >
              {saving ? "Criando..." : "Criar Sessão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── SESSION CARD ─── */
function SessionCard({
  session, busy, onComplete, onCancel,
}: {
  session: Appointment; busy: boolean; onComplete: () => void; onCancel: () => void;
}) {
  const start = new Date(session.start_at);
  const end = new Date(session.end_at);
  const now = new Date();
  const isNow = now >= start && now <= end;
  const isVideo = session.appointment_type === "video";
  const barColor = isVideo ? "#E8755A" : "#5B5EA6";

  const statusConfig: Record<AppointmentStatus, { label: string; cls: string }> = {
    scheduled: { label: "Agendada", cls: "bg-amber-50 text-amber-700" },
    completed: { label: "Realizada", cls: "bg-emerald-50 text-emerald-700" },
    cancelled: { label: "Cancelada", cls: "bg-rose-50 text-rose-700" },
    rescheduled: { label: "Reagendada", cls: "bg-indigo-50 text-indigo-700" },
  };
  const { label, cls } = statusConfig[session.status];
  const initial = (session.patient?.nome ?? "P")[0].toUpperCase();

  return (
    <div className={`flex transition-colors ${isNow ? "bg-emerald-50/40" : "hover:bg-[#FAFAF8]"}`}>
      <div className="w-1 shrink-0" style={{ backgroundColor: barColor }} />
      <div className="flex flex-1 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 shrink-0 text-center">
            <p className="text-lg font-bold leading-none text-[#2C2420]">{fmtTime(start)}</p>
            <p className="mt-0.5 text-[11px] text-[#B0A098]">até {fmtTime(end)}</p>
          </div>
          <div className="h-8 w-px shrink-0 bg-[#E8E0DC]" />
          <div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: barColor }}
              >
                {initial}
              </div>
              <p className="font-semibold text-[#2C2420]">{session.patient?.nome || "Paciente"}</p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: barColor }}
              >
                {isVideo ? <VideoIcon className="h-3 w-3" /> : <ChatIcon className="h-3 w-3" />}
                {isVideo ? "Vídeo" : "Chat"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
              {isNow && (
                <span className="flex items-center gap-1 rounded-full bg-[#4A7C59] px-2 py-0.5 text-[11px] font-semibold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Agora
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          {session.status === "scheduled" && (
            <>
              <button onClick={onComplete} disabled={busy} className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                Realizada
              </button>
              <button onClick={onCancel} disabled={busy} className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                Cancelar
              </button>
            </>
          )}
          <Link href={`/profissional/sessoes/${session.id}`} className="rounded-xl bg-[#1A1614] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2A2320]">
            Abrir
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── SLOTS GRID ─── */
function SlotsGrid({ slots, onSelect, selectedKeys }: { slots: SlotWithStatus[]; onSelect: (s: SlotWithStatus) => void; selectedKeys: Set<string> }) {
  const grouped = useMemo(() => {
    const m: SlotWithStatus[] = [], a: SlotWithStatus[] = [], e: SlotWithStatus[] = [];
    for (const s of slots) {
      const h = s.start.getHours();
      if (h < 12) m.push(s); else if (h < 18) a.push(s); else e.push(s);
    }
    return { morning: m, afternoon: a, evening: e };
  }, [slots]);

  if (!slots.length)
    return <div className="rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-6 text-center text-sm text-[#B0A098]">Sem horários para este dia</div>;

  return (
    <div className="space-y-5">
      {grouped.morning.length > 0 && <SlotGroup title="Manhã" slots={grouped.morning} onSelect={onSelect} selectedKeys={selectedKeys} />}
      {grouped.afternoon.length > 0 && <SlotGroup title="Tarde" slots={grouped.afternoon} onSelect={onSelect} selectedKeys={selectedKeys} />}
      {grouped.evening.length > 0 && <SlotGroup title="Noite" slots={grouped.evening} onSelect={onSelect} selectedKeys={selectedKeys} />}
    </div>
  );
}

function SlotGroup({ title, slots, onSelect, selectedKeys }: { title: string; slots: SlotWithStatus[]; onSelect: (s: SlotWithStatus) => void; selectedKeys: Set<string> }) {
  const styleMap: Record<string, string> = {
    available: "border-[#4A7C59]/40 bg-white text-[#2C2420] hover:border-[#4A7C59] hover:bg-emerald-50 cursor-pointer",
    blocked: "border-[#E8E0DC] bg-[#F8F4F1] text-[#C4B8AE] line-through cursor-pointer hover:border-rose-200 hover:bg-rose-50",
    booked: "border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed",
    past: "border-[#F0EAE6] bg-[#F8F4F1] text-[#D4CCC8] cursor-not-allowed",
  };
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">{title}</span>
        <span className="rounded-full bg-[#F5F0ED] px-2 py-0.5 text-[11px] font-semibold text-[#8B7B72]">{slots.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
        {slots.map((slot) => {
          const key = slotKey(slot);
          const isSelected = selectedKeys.has(key);
          const disabled = slot.status === "booked" || slot.status === "past";
          return (
            <button
              key={key}
              onClick={() => !disabled && onSelect(slot)}
              disabled={disabled}
              className={`rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition-all duration-150 ${styleMap[slot.status]} ${isSelected ? "!border-[#1A1614] !bg-[#1A1614] !text-white !no-underline" : ""}`}
            >
              {fmtTime(slot.start)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-lg border-2 px-2.5 py-1 text-xs font-bold ${color}`}>00:00</div>
      <span className="text-xs text-[#8B7B72]">{label}</span>
    </div>
  );
}

/* ─── UTILS ─── */
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function fmtTime(d: Date) { return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function slotKey(s: { start: Date; end: Date }) { return `${s.start.toISOString()}|${s.end.toISOString()}`; }
function blockKey(b: AvailabilityBlock) { return `${new Date(b.start_at).toISOString()}|${new Date(b.end_at).toISOString()}`; }

/* ─── ICONS ─── */
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function VideoIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
}
function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
}
function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
}
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
