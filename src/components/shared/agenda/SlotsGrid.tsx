"use client";

import type { Slot } from "@/services/agenda";

export function SlotsGrid({
  slots,
  onPick,
}: {
  slots: Slot[];
  onPick: (slot: Slot) => void;
}) {
  if (!slots.length) {
    return (
      <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-6 text-sm text-[#5F6B64] backdrop-blur">
        Sem horários disponíveis para este dia.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-3 backdrop-blur">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((s) => (
          <button
            key={s.start.toISOString()}
            onClick={() => onPick(s)}
            className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-sm font-semibold text-[#111111] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            {fmtTime(s.start)}
          </button>
        ))}
      </div>
    </div>
  );
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
