"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type PaymentLink = {
  id: string;
  description: string;
  amount_cents: number;
  url: string;
  status: "active" | "paid" | "cancelled";
  created_at: string;
  paid_at: string | null;
};

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LinkPagamentoPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulário
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) return;

    const { data } = await supabase
      .from("payment_links")
      .select("*")
      .eq("profissional_id", auth.user.id)
      .order("created_at", { ascending: false });

    setLinks(data ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amountStr.replace(",", "."));
    if (isNaN(parsed) || parsed < 1) {
      setError("Informe um valor válido (mínimo R$ 1,00)");
      return;
    }

    if (!description.trim()) {
      setError("Informe uma descrição");
      return;
    }

    setCreating(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) throw new Error("Não autenticado");

      const res = await fetch("/api/payments/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: Math.round(parsed * 100),
          description: description.trim(),
          profissional_id: auth.user.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar link");

      setLinks((prev) => [json.paymentLink, ...prev]);
      setDescription("");
      setAmountStr("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function cancelLink(link: PaymentLink) {
    if (!confirm(`Cancelar o link "${link.description}"? O paciente não conseguirá mais pagar por ele.`)) return;

    setCancellingId(link.id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) throw new Error("Não autenticado");

      const res = await fetch("/api/payments/cancel-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, profissional_id: auth.user.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao cancelar");

      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, status: "cancelled" } : l)),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  async function copyLink(link: PaymentLink) {
    await navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statusLabel: Record<PaymentLink["status"], string> = {
    active: "Aguardando",
    paid: "Pago",
    cancelled: "Cancelado",
  };

  const statusBadge: Record<PaymentLink["status"], string> = {
    active: "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700",
    paid: "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700",
    cancelled: "rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Profissional</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">Links de Pagamento</h1>
          <p className="mt-1 text-sm text-[#8B7B72]">Gere e gerencie cobranças avulsas</p>
        </div>
      </div>

      {/* Create Form */}
      <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
        <div className="border-b border-[#E8E0DC] px-6 py-4">
          <p className="text-sm font-bold text-[#2C2420]">Novo link de pagamento</p>
          <p className="text-xs text-[#8B7B72]">Gere um link de pagamento por cartão de crédito e envie para o paciente</p>
        </div>

        <form onSubmit={handleCreate} className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
                Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: Sessão avulsa — João"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
                Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#B0A098]">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="250,00"
                  value={amountStr}
                  onChange={(e) =>
                    setAmountStr(e.target.value.replace(/[^0-9,.]/g, ""))
                  }
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white py-3 pl-10 pr-4 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2A2320] disabled:opacity-60"
            >
              {creating ? (
                <>
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Gerar link
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Links History */}
      <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
        <div className="border-b border-[#E8E0DC] px-6 py-4">
          <p className="text-sm font-bold text-[#2C2420]">Links gerados</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon className="h-6 w-6 animate-spin text-[#C4B8AE]" />
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F8F4F1]">
              <LinkIcon className="h-10 w-10 text-[#C4B8AE]" />
            </div>
            <p className="mt-5 text-base font-bold text-[#2C2420]">Nenhum link gerado</p>
            <p className="mt-1 text-sm text-[#8B7B72]">Crie seu primeiro link de pagamento acima</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[#E8E0DC]">
                  <th className="pb-3 pl-6 pr-4 pt-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#B0A098]">Descrição</th>
                  <th className="pb-3 pr-4 pt-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#B0A098]">Valor</th>
                  <th className="pb-3 pr-4 pt-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#B0A098]">Status</th>
                  <th className="pb-3 pr-4 pt-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#B0A098]">Data</th>
                  <th className="pb-3 pr-6 pt-4 text-right text-[11px] font-semibold uppercase tracking-wider text-[#B0A098]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0ED]">
                {links.map((link) => (
                  <tr key={link.id} className="transition-colors hover:bg-[#FAFAF8]">
                    <td className="py-4 pl-6 pr-4">
                      <p className="text-sm font-semibold text-[#2C2420]">{link.description}</p>
                      <p className="mt-0.5 truncate text-xs text-[#B0A098] max-w-[180px]">{link.url}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-sm font-bold text-[#2C2420]">{fmtBRL(link.amount_cents)}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={statusBadge[link.status]}>
                        {statusLabel[link.status]}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-sm text-[#8B7B72]">{fmtDate(link.created_at)}</p>
                      {link.paid_at && (
                        <p className="mt-0.5 text-xs text-emerald-600">Pago em {fmtDate(link.paid_at)}</p>
                      )}
                    </td>
                    <td className="py-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyLink(link)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                            copiedId === link.id
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-[#E8E0DC] bg-white text-[#2C2420] hover:bg-[#F8F4F1]"
                          }`}
                        >
                          {copiedId === link.id ? (
                            <>
                              <CheckIcon className="h-3.5 w-3.5" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <CopyIcon className="h-3.5 w-3.5" />
                              Copiar
                            </>
                          )}
                        </button>

                        {link.status === "active" && (
                          <button
                            onClick={() => cancelLink(link)}
                            disabled={cancellingId === link.id}
                            className="flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 disabled:opacity-60"
                          >
                            {cancellingId === link.id ? (
                              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XIcon className="h-3.5 w-3.5" />
                            )}
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== ICONS ==========

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
