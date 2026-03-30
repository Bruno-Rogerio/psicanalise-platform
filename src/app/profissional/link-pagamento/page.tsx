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

  const statusColors: Record<PaymentLink["status"], string> = {
    active: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Link de Pagamento</h1>
        <p className="mt-1 text-sm text-warm-500">
          Gere um link de pagamento por cartão de crédito e envie para o paciente.
        </p>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-warm-900">
          Novo link
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-700">
                Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: Sessão avulsa — João"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-warm-50 px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-700">
                Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-500">
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
                  className="w-full rounded-xl border border-warm-200 bg-warm-50 py-2.5 pl-9 pr-4 text-sm text-warm-900 placeholder:text-warm-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 rounded-xl bg-[#4A7C59] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#3d6649] disabled:opacity-60"
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

      {/* Lista */}
      <div className="rounded-2xl border border-warm-200 bg-white shadow-sm">
        <div className="border-b border-warm-100 px-6 py-4">
          <h2 className="text-base font-semibold text-warm-900">
            Links gerados
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon className="h-6 w-6 animate-spin text-sage-400" />
          </div>
        ) : links.length === 0 ? (
          <div className="py-16 text-center">
            <LinkIcon className="mx-auto mb-3 h-10 w-10 text-warm-200" />
            <p className="text-sm text-warm-400">
              Nenhum link gerado ainda
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-warm-100">
            {links.map((link) => (
              <li key={link.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-warm-900">
                      {link.description}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[link.status]}`}
                    >
                      {statusLabel[link.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-warm-500">
                    <span className="font-medium text-warm-700">
                      {fmtBRL(link.amount_cents)}
                    </span>
                    <span>Criado em {fmtDate(link.created_at)}</span>
                    {link.paid_at && (
                      <span className="text-emerald-600">
                        Pago em {fmtDate(link.paid_at)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-warm-400">
                    {link.url}
                  </p>
                </div>

                <button
                  onClick={() => copyLink(link)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                    copiedId === link.id
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-warm-200 bg-warm-50 text-warm-700 hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
                  }`}
                >
                  {copiedId === link.id ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-4 w-4" />
                      Copiar link
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
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
