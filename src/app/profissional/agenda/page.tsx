"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarMonth } from "@/components/shared/agenda/CalendarMonth";
import {
  AppointmentStatus,
  ProfessionalAppointment,
  getLoggedProfessionalId,
  getMonthRange,
  listProfessionalAppointmentsForRange,
  updateAppointmentStatus,
} from "@/services/professional-agenda";
import { rescheduleAppointment } from "@/services/session";
import { isNowWithinSessionWithMargin } from "@/services/session-room";

export default function ProfissionalAgendaPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [profId, setProfId] = useState<string | null>(null);

  const [month, setMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<Date>(() =>
    startOfDay(new Date()),
  );

  const [appointments, setAppointments] = useState<ProfessionalAppointment[]>(
    [],
  );

  // Reagendamento (MVP)
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<ProfessionalAppointment | null>(null);

  const [newStartLocal, setNewStartLocal] = useState<string>("");
  const [newEndLocal, setNewEndLocal] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const id = await getLoggedProfessionalId();
        setProfId(id);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message ?? "Erro ao carregar profissional.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!profId) return;

      const { from, to } = getMonthRange(month);

      try {
        setLoading(true);
        setErrorMsg(null);

        const appts = await listProfessionalAppointmentsForRange(
          profId,
          from,
          to,
        );
        setAppointments(appts);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message ?? "Erro ao carregar agenda.");
      } finally {
        setLoading(false);
      }
    })();
  }, [profId, month]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ProfessionalAppointment[]>();
    for (const a of appointments) {
      const k = toKey(new Date(a.start_at));
      const prev = map.get(k) ?? [];
      prev.push(a);
      map.set(k, prev);
    }
    return map;
  }, [appointments]);

  const selectedSessions = useMemo(() => {
    const k = toKey(selectedDay);
    const list = sessionsByDay.get(k) ?? [];
    return [...list].sort(
      (a, b) => +new Date(a.start_at) - +new Date(b.start_at),
    );
  }, [selectedDay, sessionsByDay]);

  function hasSessions(d: Date) {
    return (sessionsByDay.get(toKey(d))?.length ?? 0) > 0;
  }

  async function onSetStatus(id: string, status: AppointmentStatus) {
    try {
      setBusy(id);
      setErrorMsg(null);

      await updateAppointmentStatus(id, status);

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? "Erro ao atualizar status.");
      alert(e?.message ?? "Erro ao atualizar status.");
    } finally {
      setBusy(null);
    }
  }

  function openReschedule(target: ProfessionalAppointment) {
    setRescheduleTarget(target);

    const start = new Date(target.start_at);
    const end = new Date(target.end_at);

    setNewStartLocal(toLocalInputValue(start));
    setNewEndLocal(toLocalInputValue(end));

    setRescheduleOpen(true);
  }

  function closeReschedule() {
    setRescheduleOpen(false);
    setRescheduleTarget(null);
    setNewStartLocal("");
    setNewEndLocal("");
  }

  async function confirmReschedule() {
    if (!rescheduleTarget) return;

    const start = fromLocalInputValue(newStartLocal);
    const end = fromLocalInputValue(newEndLocal);

    if (!start || !end) {
      alert("Preencha data/hora de início e fim.");
      return;
    }
    if (+end <= +start) {
      alert("O fim precisa ser depois do início.");
      return;
    }

    try {
      setBusy(rescheduleTarget.id);
      setErrorMsg(null);

      await rescheduleAppointment(
        rescheduleTarget.id,
        start.toISOString(),
        end.toISOString(),
      );

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rescheduleTarget.id
            ? {
                ...a,
                start_at: start.toISOString(),
                end_at: end.toISOString(),
                status: "rescheduled",
              }
            : a,
        ),
      );

      closeReschedule();
      alert("Sessão reagendada ✅");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erro ao reagendar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
          Agenda do profissional
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5F6B64] sm:text-base">
          Visão mensal com lista diária. Clique em um dia para ver as sessões e
          gerenciar status/reagendamento.
        </p>
      </header>

      {errorMsg ? (
        <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 text-sm text-[#5F6B64]">
          {errorMsg}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#111111]">
                  Calendário
                </p>
                <p className="mt-1 text-xs text-[#5F6B64]">
                  Dias com ponto indicam sessões agendadas.
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
                hasAvailability={(d) => hasSessions(d)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#111111]">
                  Sessões do dia
                </p>
                <p className="mt-1 text-xs text-[#5F6B64]">
                  {selectedSessions.length > 0
                    ? `${selectedSessions.length} sessão(ões) no dia selecionado.`
                    : "Sem sessões neste dia."}
                </p>
              </div>

              <div className="text-xs font-semibold text-[#5F6B64]">
                {loading ? "Carregando…" : "Atualizado"}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {loading ? (
                <SkeletonList />
              ) : selectedSessions.length === 0 ? (
                <EmptyDay />
              ) : (
                selectedSessions.map((s) => (
                  <div key={s.id} className="rounded-2xl">
                    <SessionCard
                      item={s}
                      busy={busy === s.id}
                      onComplete={() => onSetStatus(s.id, "completed")}
                      onCancel={() => onSetStatus(s.id, "cancelled")}
                      onReschedule={() => openReschedule(s)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">Legenda</p>
            <div className="mt-3 space-y-2 text-xs text-[#5F6B64]">
              <LegendRow
                label="Agendada"
                pill={<StatusPill status="scheduled" />}
              />
              <LegendRow
                label="Realizada"
                pill={<StatusPill status="completed" />}
              />
              <LegendRow
                label="Cancelada"
                pill={<StatusPill status="cancelled" />}
              />
              <LegendRow
                label="Reagendada"
                pill={<StatusPill status="rescheduled" />}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">
              Acesso rápido
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#5F6B64]">
              Para entrar na sessão, use “Abrir sessão” e clique em “Iniciar
              vídeo” no horário permitido.
            </p>
          </div>
        </aside>
      </div>

      {/* Modal Reagendar (MVP) */}
      {rescheduleOpen && rescheduleTarget ? (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={closeReschedule}
          />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-2xl rounded-t-3xl border border-[#D6DED9] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111111]">
                  Reagendar sessão
                </p>
                <p className="mt-1 text-xs text-[#5F6B64]">
                  Ajuste data e horário (MVP). Depois refinamos para seleção por
                  slots.
                </p>
              </div>
              <button
                onClick={closeReschedule}
                className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-white/80"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#111111]">
                  Início
                </span>
                <input
                  type="datetime-local"
                  value={newStartLocal}
                  onChange={(e) => setNewStartLocal(e.target.value)}
                  className="w-full rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-sm text-[#111111] outline-none focus:ring-2 focus:ring-black/10"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#111111]">
                  Fim
                </span>
                <input
                  type="datetime-local"
                  value={newEndLocal}
                  onChange={(e) => setNewEndLocal(e.target.value)}
                  className="w-full rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-sm text-[#111111] outline-none focus:ring-2 focus:ring-black/10"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Link
                href={`/profissional/sessoes/${rescheduleTarget.id}`}
                className="rounded-xl border border-[#D6DED9] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-white/80"
              >
                Abrir sessão
              </Link>

              <button
                disabled={busy === rescheduleTarget.id}
                onClick={confirmReschedule}
                className="rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Confirmar reagendamento
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SessionCard({
  item,
  busy,
  onComplete,
  onCancel,
  onReschedule,
}: {
  item: ProfessionalAppointment;
  busy: boolean;
  onComplete: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const start = new Date(item.start_at);
  const end = new Date(item.end_at);
  const time = `${fmtTime(start)}–${fmtTime(end)}`;

  const canEnterVideo =
    item.appointment_type === "video" &&
    item.status !== "cancelled" &&
    isNowWithinSessionWithMargin(item.start_at, item.end_at, 10);

  const disableActions =
    busy || item.status === "completed" || item.status === "cancelled";

  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#111111]">{time}</p>
            <StatusPill status={item.status} />
            <TypePill type={item.appointment_type} />
          </div>

          <p className="mt-2 truncate text-sm text-[#111111]">Sessão</p>
          <p className="mt-1 text-xs text-[#5F6B64]">
            ID: <span className="font-medium">{item.id}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/profissional/sessoes/${item.id}`}
              className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-white/80"
            >
              Abrir sessão
            </Link>

            <Link
              href={`/profissional/sessoes/${item.id}`}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                canEnterVideo
                  ? "bg-[#111111] text-white hover:opacity-90"
                  : "border border-[#D6DED9] bg-white text-[#5F6B64]"
              }`}
              aria-disabled={!canEnterVideo}
              onClick={(e) => {
                if (!canEnterVideo) e.preventDefault();
              }}
            >
              Entrar (vídeo)
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            disabled={disableActions}
            onClick={onComplete}
            className="rounded-xl bg-[#111111] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Marcar realizada
          </button>

          <button
            disabled={disableActions}
            onClick={onCancel}
            className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-white/80 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            disabled={disableActions}
            onClick={onReschedule}
            className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-white/80 disabled:opacity-50"
          >
            Reagendar
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: AppointmentStatus }) {
  const { label, cls } = useMemo(() => {
    switch (status) {
      case "scheduled":
        return { label: "Agendada", cls: "bg-white text-[#111111]" };
      case "completed":
        return { label: "Realizada", cls: "bg-[#111111] text-white" };
      case "cancelled":
        return { label: "Cancelada", cls: "bg-white text-[#5F6B64]" };
      case "rescheduled":
        return { label: "Reagendada", cls: "bg-white text-[#111111]" };
      default:
        return { label: String(status), cls: "bg-white text-[#111111]" };
    }
  }, [status]);

  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#D6DED9] px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function TypePill({ type }: { type: "video" | "chat" }) {
  const label = type === "video" ? "Vídeo" : "Chat";
  return (
    <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
      {label}
    </span>
  );
}

function LegendRow({ label, pill }: { label: string; pill: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      {pill}
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-4 text-sm text-[#5F6B64]">
      Sem sessões neste dia.
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[92px] animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70"
        />
      ))}
    </div>
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toKey(d: Date) {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDayTitle(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function fromLocalInputValue(value: string) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(+dt)) return null;
  return dt;
}
