"use client";

type Props = {
  selected: Date;
  onSelect: (d: Date) => void;
  month: Date;
  onMonthChange: (d: Date) => void;
  hasAvailability?: (d: Date) => boolean; // opcional: pinta dias com horários
};

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarMonth({
  selected,
  onSelect,
  month,
  onMonthChange,
  hasAvailability,
}: Props) {
  const weeks = buildMonthGrid(month);

  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-sm font-semibold text-[#111111] hover:bg-white/80"
          aria-label="Mês anterior"
        >
          ←
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-[#111111]">
            {month.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-[#5F6B64]">
            Toque em um dia para ver horários
          </p>
        </div>

        <button
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-sm font-semibold text-[#111111] hover:bg-white/80"
          aria-label="Próximo mês"
        >
          →
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#5F6B64]">
        {WEEK.map((w, i) => (
          <div key={`${w}-${i}`} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {weeks.flat().map((cell, idx) => {
          if (!cell) return <div key={idx} className="h-11" />;

          const isSelected = sameDay(cell, selected);
          const isToday = sameDay(cell, new Date());
          const isPast =
            startOfDay(cell).getTime() < startOfDay(new Date()).getTime();
          const dot = hasAvailability ? hasAvailability(cell) : false;

          return (
            <button
              key={cell.toISOString()}
              onClick={() => onSelect(cell)}
              className={[
                "relative h-11 rounded-xl border text-sm font-semibold transition",
                isSelected
                  ? "border-[#2F6F4E]/40 bg-white text-[#111111] shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                  : "border-transparent bg-transparent text-[#36413A] hover:border-[#D6DED9] hover:bg-white/60",
                isPast ? "opacity-40" : "",
              ].join(" ")}
            >
              <span
                className={
                  isToday && !isSelected ? "underline underline-offset-4" : ""
                }
              >
                {cell.getDate()}
              </span>

              {dot && !isPast ? (
                <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#2F6F4E]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // domingo anterior ou o próprio

  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const days: (Date | null)[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const cell = new Date(d);
    if (cell.getMonth() !== month.getMonth()) days.push(null);
    else days.push(cell);
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
