"use client";

import { useMemo, useState } from "react";
import { CalendarMonth } from "@/components/shared/agenda/CalendarMonth";
import { SlotsGrid } from "@/components/shared/agenda/SlotsGrid";
import {
  AvailabilityBlock,
  AvailabilityRule,
  Appointment,
  AppointmentType,
  ProfessionalSettings,
  Slot,
  generateSlotsForDay,
} from "@/services/agenda";

export function RescheduleModal({
  open,
  onClose,
  month,
  onMonthChange,
  selectedDay,
  onSelectDay,
  type,
  settings,
  rules,
  blocks,
  booked,
  currentAppointmentId,
  onPick,
}: {
  open: boolean;
  onClose: () => void;

  month: Date;
  onMonthChange: (d: Date) => void;

  selectedDay: Date;
  onSelectDay: (d: Date) => void;

  type: AppointmentType;

  settings: ProfessionalSettings | null;
  rules: AvailabilityRule[];
  blocks: AvailabilityBlock[];
  booked: Appointment[];
  currentAppointmentId: string;

  onPick: (slot: Slot) => void;
}) {
  const [localPicked, setLocalPicked] = useState<Slot | null>(null);

  const daySlots = useMemo(() => {
    if (!settings) return [];

    // IMPORTANTE:
    // removemos o appointment atual do "booked" pra não bloquear o próprio horário.
    const bookedFiltered = booked.filter((b) => b.id !== currentAppointmentId);

    return generateSlotsForDay({
      day: selectedDay,
      type,
      rules,
      settings,
      blocks,
      booked: bookedFiltered,
    });
  }, [
    settings,
    selectedDay,
    type,
    rules,
    blocks,
    booked,
    currentAppointmentId,
  ]);

  const hasAvailability = (d: Date) => {
    if (!settings) return false;
    const bookedFiltered = booked.filter((b) => b.id !== currentAppointmentId);
    const slots = generateSlotsForDay({
      day: d,
      type,
      rules,
      settings,
      blocks,
      booked: bookedFiltered,
    });
    return slots.length > 0;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <div className="relative w-full max-w-3xl rounded-t-3xl border border-[#D6DED9] bg-[#EEF3EF] p-4 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold tracking-tight text-[#111111]">
              Reagendar sessão
            </p>
            <p className="mt-1 text-xs text-[#5F6B64]">
              Selecione um novo dia e um horário disponível.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-white/80"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">Dia</p>
            <div className="mt-3">
              <CalendarMonth
                month={month}
                onMonthChange={onMonthChange}
                selected={selectedDay}
                onSelect={onSelectDay}
                hasAvailability={hasAvailability}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-[#111111]">Horário</p>
            <p className="mt-1 text-xs text-[#5F6B64]">
              Toque em um horário para confirmar.
            </p>

            <div className="mt-3">
              <SlotsGrid
                slots={daySlots}
                onPick={(slot) => setLocalPicked(slot)}
              />
            </div>

            <button
              disabled={!localPicked}
              onClick={() => localPicked && onPick(localPicked)}
              className="mt-4 w-full rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Confirmar reagendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
