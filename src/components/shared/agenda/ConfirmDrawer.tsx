"use client";

import type { Slot, Product } from "@/services/agenda";

export function ConfirmDrawer({
  open,
  onClose,
  slot,
  product,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  slot: Slot | null;
  product: Product | null;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-[#D6DED9] bg-white p-5 shadow-[0_-20px_80px_rgba(0,0,0,0.18)]">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-zinc-200" />

        <div className="mt-4 space-y-3">
          <p className="text-base font-semibold text-[#111111]">
            Confirmar agendamento
          </p>

          <div className="rounded-2xl border border-[#D6DED9] bg-[#EEF3EF]/40 p-4">
            <Row label="Data" value={slot ? fmtDate(slot.start) : "-"} />
            <Row
              label="Horário"
              value={
                slot ? `${fmtTime(slot.start)} • ${fmtTime(slot.end)}` : "-"
              }
            />
            <Row
              label="Tipo"
              value={
                slot
                  ? slot.appointment_type === "video"
                    ? "Vídeo"
                    : "Chat"
                  : "-"
              }
            />
            <Row
              label="Plano"
              value={product ? product.title : "Selecione um plano"}
            />
          </div>

          <button
            disabled={!slot || !product || loading}
            onClick={onConfirm}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Agendando..." : "Confirmar"}
          </button>

          <button
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#D6DED9] bg-white px-5 py-3 text-sm font-semibold text-[#111111]"
          >
            Voltar
          </button>

          <p className="text-xs leading-relaxed text-[#5F6B64]">
            Cancelamento com reembolso até 24h antes. Menos que isso:
            reagendamento.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold text-[#5F6B64]">{label}</span>
      <span className="text-sm font-semibold text-[#111111]">{value}</span>
    </div>
  );
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
