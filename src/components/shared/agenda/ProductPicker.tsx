"use client";

import type { Product } from "@/services/agenda";

export function ProductPicker({
  products,
  selectedId,
  onSelect,
}: {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111111]">
            Escolha um plano
          </p>
          <p className="mt-1 text-xs text-[#5F6B64]">
            A compra vem antes do agendamento. Você escolhe o horário depois.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        {products.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={[
                "w-full rounded-2xl border p-4 text-left transition",
                active
                  ? "border-[#2F6F4E]/40 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                  : "border-[#D6DED9] bg-white/60 hover:bg-white/80",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">
                    {p.title}
                  </p>
                  {p.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-[#5F6B64]">
                      {p.description}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#111111]">
                    {fmtBRL(p.price_cents)}
                  </p>
                  <p className="mt-1 text-xs text-[#5F6B64]">
                    {p.sessions_count}{" "}
                    {p.sessions_count === 1 ? "sessão" : "sessões"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
