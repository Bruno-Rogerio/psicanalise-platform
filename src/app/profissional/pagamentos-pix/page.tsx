// src/app/profissional/pagamentos-pix/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase-browser";
import type { OrderWithItems } from "@/types/payment";
import { formatCents } from "@/services/products";

export default function PagamentosPixPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) return;

      setProfessionalId(auth.user.id);

      // Busca orders PIX pendentes
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          items:order_items(*),
          product:products(*),
          user:profiles!orders_user_id_fkey(id, nome)
        `,
        )
        .eq("profissional_id", auth.user.id)
        .eq("payment_method", "pix")
        .in("status", ["pending_pix"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data || []) as OrderWithItems[]);
    } catch (error: any) {
      console.error("Erro ao carregar pagamentos:", error);
      toast(error.message || "Erro ao carregar pagamentos", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(orderId: string) {
    if (!professionalId) return;
    if (!confirm("Confirmar que o pagamento PIX foi recebido?")) return;

    try {
      setValidating(orderId);

      console.log("🔵 Validating PIX:", { orderId, professionalId });

      const response = await fetch("/api/payments/validate-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          professionalId,
        }),
      });

      console.log("📡 Response status:", response.status);

      const text = await response.text();
      console.log("📄 Response text:", text);

      if (!response.ok) {
        let errorMessage = "Erro ao validar pagamento";
        try {
          const error = JSON.parse(text);
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", text);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse success response:", text);
        throw new Error("Resposta inválida do servidor");
      }

      console.log("✅ Validation successful:", data);

      toast("Pagamento validado! Créditos liberados para o cliente.", "success");
      loadOrders();
    } catch (error: any) {
      console.error("Erro ao validar pagamento:", error);
      toast(error.message || "Erro ao validar pagamento", "error");
    } finally {
      setValidating(null);
    }
  }

  async function handleReject(orderId: string) {
    if (!confirm("Rejeitar este pagamento? Esta ação não pode ser desfeita."))
      return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      toast("Pagamento rejeitado.", "info");
      loadOrders();
    } catch (error: any) {
      console.error("Erro ao rejeitar pagamento:", error);
      toast(error.message || "Erro ao rejeitar pagamento", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-[#F5F0ED]" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-[#F5F0ED]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Profissional</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">Validar PIX</h1>
          <p className="mt-1 text-sm text-[#8B7B72]">Pagamentos aguardando confirmação</p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#E8E0DC] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2420] transition-all hover:bg-[#F8F4F1] disabled:opacity-50"
        >
          <RefreshIcon className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
            <ClockIcon className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-[#2C2420]">{orders.length}</p>
          <p className="text-sm text-[#8B7B72]">Aguardando Validação</p>
        </div>
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
            <MoneyIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#2C2420]">
            {formatCents(orders.reduce((sum, o) => sum + o.amount_cents, 0))}
          </p>
          <p className="text-sm text-[#8B7B72]">Valor Total</p>
        </div>
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4A7C59]/10">
            <UserIcon className="h-5 w-5 text-[#4A7C59]" />
          </div>
          <p className="text-2xl font-bold text-[#2C2420]">
            {new Set(orders.map((o) => o.user_id)).size}
          </p>
          <p className="text-sm text-[#8B7B72]">Clientes</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F8F4F1]">
                <CheckCircleIcon className="h-10 w-10 text-[#C4B8AE]" />
              </div>
              <p className="mt-5 text-base font-bold text-[#2C2420]">Tudo em dia!</p>
              <p className="mt-1 text-sm text-[#8B7B72]">Não há pagamentos PIX pendentes de validação.</p>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onValidate={() => handleValidate(order.id)}
              onReject={() => handleReject(order.id)}
              validating={validating === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ===== COMPONENTS =====

function OrderCard({
  order,
  onValidate,
  onReject,
  validating,
}: {
  order: OrderWithItems;
  onValidate: () => void;
  onReject: () => void;
  validating: boolean;
}) {
  const createdAt = new Date(order.created_at);
  const user = (order as any).user;

  return (
    <div className="overflow-hidden rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
      {/* Card Header */}
      <div className="border-b border-[#E8E0DC] px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <PixIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-[#2C2420]">
                {user?.nome || "Cliente"}
              </p>
              <p className="text-sm text-[#8B7B72]">
                ID: {order.user_id.substring(0, 8)}...
              </p>
              <p className="mt-0.5 text-xs text-[#B0A098]">
                {createdAt.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-[#2C2420]">
              {formatCents(order.amount_cents)}
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <ClockIcon className="h-3 w-3" />
              Pendente
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-4">
        {/* Product info */}
        <div className="rounded-2xl border border-[#E8E0DC] bg-[#FAFAF8] p-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-[#2C2420]">{item.title}</p>
                <p className="text-sm text-[#8B7B72]">
                  {item.sessions_count}{" "}
                  {item.sessions_count === 1 ? "sessão" : "sessões"}
                </p>
              </div>
              <p className="font-bold text-[#2C2420]">
                {formatCents(item.price_cents)}
              </p>
            </div>
          ))}
        </div>

        {/* PIX Reference */}
        <div className="rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-4">
          <div className="flex items-start gap-3">
            <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#4A7C59]" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#2C2420]">
                Referência PIX
              </p>
              <p className="mt-1 font-mono text-xs text-[#8B7B72]">
                {order.pix_reference}
              </p>
              <p className="mt-2 text-xs text-[#8B7B72]">
                Verifique se recebeu um PIX com esta referência no valor de{" "}
                <strong className="text-[#2C2420]">{formatCents(order.amount_cents)}</strong> antes de
                validar.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReject}
            disabled={validating}
            className="flex-1 rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
          >
            Rejeitar
          </button>
          <button
            onClick={onValidate}
            disabled={validating}
            className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {validating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Validando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Confirmar Pagamento
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== ICONS =====

function PixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.2 6.4L12 9.6 8.8 6.4 6.4 8.8 9.6 12l-3.2 3.2 2.4 2.4L12 14.4l3.2 3.2 2.4-2.4L14.4 12l3.2-3.2z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
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
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function MoneyIcon({ className }: { className?: string }) {
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
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
