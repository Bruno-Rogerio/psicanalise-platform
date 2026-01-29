"use client";

import { useMemo } from "react";

type Props = {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected: Date;
  onSelect: (d: Date) => void;
  hasAvailability?: (d: Date) => boolean;
};

export function CalendarMonth({
  month,
  onMonthChange,
  selected,
  onSelect,
  hasAvailability,
}: Props) {
  const weeks = useMemo(() => buildCalendarWeeks(month), [month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function prevMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(d);
  }

  function nextMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(d);
  }

  const monthLabel = month.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="group flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 transition-all duration-300 hover:bg-warm-200/50 hover:text-warm-800"
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
        </button>

        <h3 className="text-base font-semibold capitalize text-warm-900">
          {monthLabel}
        </h3>

        <button
          onClick={nextMonth}
          className="group flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 transition-all duration-300 hover:bg-warm-200/50 hover:text-warm-800"
          aria-label="Próximo mês"
        >
          <ChevronRightIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="py-2 text-xs font-semibold text-warm-500">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.flat().map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-11" />;
          }

          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);

          const isPast = dayStart < today;
          const isToday = dayStart.getTime() === today.getTime();
          const isSelected = day.toDateString() === selected.toDateString();
          const hasSlots = hasAvailability?.(day) ?? false;

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onSelect(day)}
              disabled={isPast}
              className={`group relative flex h-11 flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 ${
                isPast
                  ? "cursor-not-allowed text-warm-300"
                  : isSelected
                    ? "bg-sage-600 text-white shadow-md ring-2 ring-sage-600 ring-offset-2"
                    : isToday
                      ? "bg-sage-100 text-sage-800 font-bold ring-2 ring-sage-300"
                      : hasSlots
                        ? "bg-white text-warm-800 hover:bg-sage-50 hover:shadow-sm border border-warm-200"
                        : "text-warm-400 hover:bg-warm-100"
              }`}
            >
              {/* Day number - sempre visível */}
              <span>{day.getDate()}</span>

              {/* Availability dot - apenas quando não selecionado e tem slots */}
              {hasSlots && !isSelected && !isPast && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-sage-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-warm-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sage-500" />
          Disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warm-200" />
          Indisponível
        </span>
      </div>
    </div>
  );
}

function buildCalendarWeeks(month: Date): (Date | null)[][] {
  const year = month.getFullYear();
  const m = month.getMonth();

  const firstDay = new Date(year, m, 1);
  const lastDay = new Date(year, m + 1, 0);

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay.getDay(); i++) {
    week.push(null);
  }

  // Days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, m, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Empty cells after last day
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  return weeks;
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
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
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
