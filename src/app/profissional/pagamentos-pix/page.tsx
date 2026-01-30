// src/app/profissional/pagamentos-pix/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { OrderWithItems } from "@/types/payment";
import { formatCents } from "@/services/products";

export default function PagamentosPixPage() {
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
          user:profiles!orders_user_id_fkey(id, nome, email)
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
      alert(error.message || "Erro ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(orderId: string) {
    if (!professionalId) return;
    if (!confirm("Confirmar que o pagamento PIX foi recebido?")) return;

    try {
      setValidating(orderId);

      const response = await fetch("/api/payments/validate-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          professionalId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao validar pagamento");
      }

      alert("✅ Pagamento validado! Créditos liberados para o cliente.");
      loadOrders(); // Recarrega lista
    } catch (error: any) {
      console.error("Erro ao validar pagamento:", error);
      alert(error.message || "Erro ao validar pagamento");
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

      alert("Pagamento rejeitado.");
      loadOrders();
    } catch (error: any) {
      console.error("Erro ao rejeitar pagamento:", error);
      alert(error.message || "Erro ao rejeitar pagamento");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-warm-200" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-warm-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <PixIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900 sm:text-3xl">
              Validação de PIX
            </h1>
            <p className="mt-1 text-warm-600">
              Confirme pagamentos PIX recebidos dos clientes
            </p>
          </div>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-warm-300 bg-white px-6 py-3 text-sm font-semibold text-warm-700 shadow-soft transition-all hover:bg-warm-50 hover:shadow-soft-lg disabled:opacity-50"
        >
          <RefreshIcon className="h-5 w-5" />
          Atualizar
        </button>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<ClockIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          label="Aguardando Validação"
          value={orders.length.toString()}
        />
        <StatCard
          icon={<MoneyIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          label="Valor Total"
          value={formatCents(
            orders.reduce((sum, o) => sum + o.amount_cents, 0),
          )}
        />
        <StatCard
          icon={<UserIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-indigo-500 to-indigo-600"
          label="Clientes"
          value={new Set(orders.map((o) => o.user_id)).size.toString()}
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
              <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-warm-900">
              Tudo em dia!
            </h3>
            <p className="mt-2 text-sm text-warm-600">
              Não há pagamentos PIX pendentes de validação.
            </p>
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

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} text-white shadow-md`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-warm-900">{value}</p>
      <p className="text-sm font-medium text-warm-700">{label}</p>
    </div>
  );
}

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
    <div className="overflow-hidden rounded-2xl border-2 border-warm-200 bg-white shadow-soft transition-all hover:shadow-soft-lg">
      <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <PixIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-warm-900">
                {user?.nome || "Cliente"}
              </p>
              <p className="text-sm text-warm-600">{user?.email || "—"}</p>
              <p className="mt-1 text-xs text-warm-500">
                {createdAt.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-warm-900">
              {formatCents(order.amount_cents)}
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border-2 border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <ClockIcon className="h-3.5 w-3.5" />
              Pendente
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Product info */}
        <div className="mb-4 rounded-xl border border-warm-200 bg-warm-50/50 p-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-warm-900">{item.title}</p>
                <p className="text-sm text-warm-600">
                  {item.sessions_count}{" "}
                  {item.sessions_count === 1 ? "sessão" : "sessões"}
                </p>
              </div>
              <p className="font-bold text-warm-900">
                {formatCents(item.price_cents)}
              </p>
            </div>
          ))}
        </div>

        {/* PIX Reference */}
        <div className="mb-4 rounded-xl bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">
                Referência PIX
              </p>
              <p className="mt-1 font-mono text-xs text-blue-700">
                {order.pix_reference}
              </p>
              <p className="mt-2 text-xs text-blue-700">
                Verifique se recebeu um PIX com esta referência no valor de{" "}
                <strong>{formatCents(order.amount_cents)}</strong> antes de
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
            className="flex-1 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
          >
            Rejeitar
          </button>
          <button
            onClick={onValidate}
            disabled={validating}
            className="group relative flex-1 overflow-hidden rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
          >
            {validating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Validando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
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
