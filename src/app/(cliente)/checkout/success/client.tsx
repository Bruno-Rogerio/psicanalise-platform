"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/services/payments";
import type { OrderWithItems } from "@/types/payment";
import { formatCents } from "@/services/products";

export function CheckoutSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderWithItems | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error: any) {
      console.error("Erro ao carregar pedido:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      router.push("/dashboard");
      return;
    }

    void loadOrder();
  }, [orderId, router, loadOrder]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-warm-200 border-t-sage-500" />
          <p className="mt-4 text-warm-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-100">
            <AlertIcon className="h-10 w-10 text-rose-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-warm-900">
            Pedido não encontrado
          </h1>
          <p className="mt-2 text-warm-600">
            Não foi possível encontrar este pedido.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sage-500 px-6 py-3 font-semibold text-white transition-all hover:bg-sage-600"
          >
            Ir para Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const isPendingPix = order.status === "pending_pix";
  const isCard = order.payment_method === "card";

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-4 py-12">
      <div className="space-y-8">
        {/* Success Icon */}
        <div className="text-center">
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
              isPaid
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                : "bg-gradient-to-br from-amber-400 to-amber-600"
            } shadow-2xl`}
          >
            {isPaid ? (
              <CheckCircleIcon className="h-14 w-14 text-white" />
            ) : (
              <ClockIcon className="h-14 w-14 text-white" />
            )}
          </div>

          <h1 className="mt-6 text-3xl font-bold text-warm-900">
            {isPaid
              ? "Pagamento Confirmado!"
              : isPendingPix
                ? "PIX Registrado!"
                : "Processando..."}
          </h1>

          <p className="mt-2 text-lg text-warm-600">
            {isPaid
              ? "Seus créditos foram liberados e já estão disponíveis."
              : isPendingPix
                ? "Aguardando validação do profissional."
                : "Seu pagamento está sendo processado."}
          </p>
        </div>

        {/* Order Details */}
        <div className="overflow-hidden rounded-2xl border-2 border-warm-200 bg-white shadow-soft">
          <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white p-6">
            <h2 className="font-bold text-warm-900">Detalhes do Pedido</h2>
            <p className="text-sm text-warm-600">
              {new Date(order.created_at).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="space-y-4 p-6">
            {/* Items */}
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-xl border border-warm-200 bg-warm-50/50 p-4"
              >
                <div>
                  <p className="font-semibold text-warm-900">{item.title}</p>
                  <p className="mt-1 text-sm text-warm-600">
                    {item.sessions_count}{" "}
                    {item.sessions_count === 1 ? "sessão" : "sessões"}
                  </p>
                </div>
                <p className="font-bold text-warm-900">
                  {formatCents(item.price_cents)}
                </p>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between border-t-2 border-warm-200 pt-4">
              <p className="text-lg font-semibold text-warm-900">Total</p>
              <p className="text-2xl font-bold text-sage-600">
                {formatCents(order.amount_cents)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200">
                {isCard ? (
                  <CreditCardIcon className="h-5 w-5 text-blue-700" />
                ) : (
                  <PixIcon className="h-5 w-5 text-blue-700" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {isCard ? "Cartão de Crédito" : "PIX"}
                </p>
                <p className="text-xs text-blue-700">
                  {isPaid ? "Pagamento confirmado" : "Aguardando confirmação"}
                </p>
              </div>
            </div>

            {/* PIX Reference */}
            {isPendingPix && order.pix_reference && (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Aguardando Validação
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-700">
                      O profissional validará seu pagamento em breve. Você
                      receberá uma notificação quando seus créditos forem
                      liberados.
                    </p>
                    <p className="mt-2 font-mono text-xs text-amber-600">
                      Ref: {order.pix_reference}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {isPaid && (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Créditos Disponíveis
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                      Seus créditos foram adicionados e você já pode agendar
                      suas sessões.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {isPaid ? (
            <>
              <Link
                href="/agenda"
                className="flex-1 rounded-xl bg-sage-500 px-6 py-4 text-center font-semibold text-white transition-all hover:bg-sage-600"
              >
                Agendar Sessão
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl border-2 border-warm-300 bg-white px-6 py-4 text-center font-semibold text-warm-700 transition-all hover:bg-warm-50"
              >
                Ir para Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl bg-sage-500 px-6 py-4 text-center font-semibold text-white transition-all hover:bg-sage-600"
              >
                Ir para Dashboard
              </Link>
              <button
                type="button"
                onClick={() => void loadOrder()}
                className="flex-1 rounded-xl border-2 border-warm-300 bg-white px-6 py-4 text-center font-semibold text-warm-700 transition-all hover:bg-warm-50"
              >
                Atualizar Status
              </button>
            </>
          )}
        </div>

        {/* Help */}
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 text-center">
          <p className="text-sm text-warm-600">
            Precisa de ajuda?{" "}
            <a
              href="mailto:suporte@exemplo.com"
              className="font-semibold text-sage-600 hover:underline"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Icons
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

function AlertIcon({ className }: { className?: string }) {
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
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
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
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function PixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.2 6.4L12 9.6 8.8 6.4 6.4 8.8 9.6 12l-3.2 3.2 2.4 2.4L12 14.4l3.2 3.2 2.4-2.4L14.4 12l3.2-3.2z" />
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
