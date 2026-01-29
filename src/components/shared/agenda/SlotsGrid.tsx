"use client";

import { useMemo } from "react";
import type { Slot } from "@/services/agenda";

type Props = {
  slots: Slot[];
  onPick: (slot: Slot) => void;
  selectedSlot?: Slot | null;
};

export function SlotsGrid({ slots, onPick, selectedSlot }: Props) {
  // Agrupa slots por período do dia
  const grouped = useMemo(() => {
    const morning: Slot[] = [];
    const afternoon: Slot[] = [];
    const evening: Slot[] = [];

    for (const slot of slots) {
      const hour = slot.start.getHours();
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 18) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    }

    return { morning, afternoon, evening };
  }, [slots]);

  if (!slots.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-warm-300/50 bg-white p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warm-100">
          <CalendarXIcon className="h-7 w-7 text-warm-400" />
        </div>
        <p className="mt-4 text-center text-sm font-medium text-warm-700">
          Sem horários disponíveis
        </p>
        <p className="mt-1 text-center text-xs text-warm-500">
          Tente selecionar outro dia no calendário
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.morning.length > 0 && (
        <SlotGroup
          title="Manhã"
          icon={<SunriseIcon className="h-4 w-4" />}
          slots={grouped.morning}
          onPick={onPick}
          selectedSlot={selectedSlot}
        />
      )}

      {grouped.afternoon.length > 0 && (
        <SlotGroup
          title="Tarde"
          icon={<SunIcon className="h-4 w-4" />}
          slots={grouped.afternoon}
          onPick={onPick}
          selectedSlot={selectedSlot}
        />
      )}

      {grouped.evening.length > 0 && (
        <SlotGroup
          title="Noite"
          icon={<MoonIcon className="h-4 w-4" />}
          slots={grouped.evening}
          onPick={onPick}
          selectedSlot={selectedSlot}
        />
      )}
    </div>
  );
}

function SlotGroup({
  title,
  icon,
  slots,
  onPick,
  selectedSlot,
}: {
  title: string;
  icon: React.ReactNode;
  slots: Slot[];
  onPick: (slot: Slot) => void;
  selectedSlot?: Slot | null;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-warm-500">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-warm-600">
          {title}
        </span>
        <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-medium text-warm-600">
          {slots.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {slots.map((slot) => {
          const isSelected =
            selectedSlot?.start.toISOString() === slot.start.toISOString();

          return (
            <button
              key={slot.start.toISOString()}
              onClick={() => onPick(slot)}
              className={`group relative overflow-hidden rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
                isSelected
                  ? "border-sage-500 bg-sage-600 text-white shadow-md"
                  : "border-warm-200 bg-white text-warm-800 hover:border-sage-300 hover:bg-sage-50 hover:shadow-sm"
              }`}
            >
              {/* Time */}
              <span className="relative">{fmtTime(slot.start)}</span>

              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
                  <CheckIcon className="h-2.5 w-2.5 text-sage-600" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Icons
function CalendarXIcon({ className }: { className?: string }) {
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
        d="M10 14l4 4m0-4l-4 4"
      />
    </svg>
  );
}

function SunriseIcon({ className }: { className?: string }) {
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
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
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
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
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
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
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
