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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#F2EDE8" }}
      >
        <div className="text-center">
          <div
            className="mx-auto h-16 w-16 animate-spin rounded-full border-4"
            style={{
              borderColor: "rgba(26,22,20,0.12)",
              borderTopColor: "#4A7C59",
            }}
          />
          <p
            className="mt-4 text-sm font-medium"
            style={{ color: "rgba(26,22,20,0.50)" }}
          >
            Carregando seu pedido...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ background: "#F2EDE8" }}
      >
        <div className="w-full max-w-md text-center">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: "rgba(232,117,90,0.12)" }}
          >
            <AlertIcon className="h-10 w-10" style={{ color: "#E8755A" }} />
          </div>
          <h1
            className="mt-6 text-2xl font-black"
            style={{ color: "#1A1614" }}
          >
            Pedido não encontrado
          </h1>
          <p
            className="mt-2 text-base"
            style={{ color: "rgba(26,22,20,0.55)" }}
          >
            Não foi possível encontrar este pedido.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#4A7C59" }}
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
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#F2EDE8" }}
    >
      {/* Decorative background orbs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full blur-3xl"
        style={{
          background: isPaid
            ? "rgba(74,124,89,0.18)"
            : "rgba(212,167,44,0.18)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(232,117,90,0.12)" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-6">
          {/* ── Success icon ── */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {/* Pulsing rings — only when paid */}
              {isPaid && (
                <>
                  <span
                    className="absolute inset-0 animate-ping rounded-full opacity-20"
                    style={{ background: "#4A7C59" }}
                  />
                  <span
                    className="absolute -inset-3 animate-ping rounded-full opacity-10"
                    style={{
                      background: "#4A7C59",
                      animationDelay: "0.3s",
                      animationDuration: "1.5s",
                    }}
                  />
                </>
              )}
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full shadow-2xl"
                style={{
                  background: isPaid ? "#4A7C59" : "#D4A72C",
                }}
              >
                {isPaid ? (
                  <CheckCircleIcon className="h-14 w-14 text-white" />
                ) : (
                  <ClockIcon className="h-14 w-14 text-white" />
                )}
              </div>
            </div>

            <h1
              className="mt-8 text-4xl font-black"
              style={{ color: "#1A1614" }}
            >
              {isPaid
                ? "Pagamento Confirmado!"
                : isPendingPix
                  ? "PIX Registrado!"
                  : "Processando..."}
            </h1>

            <p
              className="mt-3 max-w-sm text-base"
              style={{ color: "rgba(26,22,20,0.55)" }}
            >
              {isPaid
                ? "Seus créditos foram liberados e já estão disponíveis."
                : isPendingPix
                  ? "Aguardando validação do profissional."
                  : "Seu pagamento está sendo processado."}
            </p>
          </div>

          {/* ── Order details card ── */}
          <div
            className="overflow-hidden rounded-3xl border bg-white shadow-lg"
            style={{
              borderColor: "rgba(26,22,20,0.08)",
              boxShadow: "0 8px 40px rgba(26,22,20,0.10)",
            }}
          >
            {/* Card header — dark */}
            <div
              className="flex items-center justify-between p-6"
              style={{ background: "#1A1614" }}
            >
              <div>
                <h2 className="text-base font-bold text-white">
                  Detalhes do Pedido
                </h2>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {new Date(order.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <ReceiptIcon
                  className="h-5 w-5"
                  style={{ color: "rgba(255,255,255,0.60)" }}
                />
              </div>
            </div>

            {/* Card body */}
            <div className="space-y-4 p-6">
              {/* Items */}
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-2xl p-4"
                  style={{ background: "#F2EDE8" }}
                >
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: "#1A1614" }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="mt-0.5 text-sm"
                      style={{ color: "rgba(26,22,20,0.50)" }}
                    >
                      {item.sessions_count}{" "}
                      {item.sessions_count === 1 ? "sessão" : "sessões"}
                      {item.sessions_count > 1 && (
                        <span
                          className="ml-2"
                          style={{ color: "rgba(26,22,20,0.40)" }}
                        >
                          •{" "}
                          {formatCents(
                            Math.round(item.price_cents / item.sessions_count),
                          )}{" "}
                          / sessão
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-bold" style={{ color: "#1A1614" }}>
                    {formatCents(item.price_cents)}
                  </p>
                </div>
              ))}

              {/* Total */}
              <div
                className="flex items-center justify-between border-t pt-4"
                style={{ borderColor: "rgba(26,22,20,0.08)" }}
              >
                <p
                  className="text-base font-semibold"
                  style={{ color: "#1A1614" }}
                >
                  Total
                </p>
                <p
                  className="text-2xl font-black"
                  style={{ color: "#4A7C59" }}
                >
                  {formatCents(order.amount_cents)}
                </p>
              </div>

              {/* Payment method */}
              <div
                className="flex items-center gap-3 rounded-2xl p-4"
                style={{ background: "rgba(91,94,166,0.07)" }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(91,94,166,0.15)" }}
                >
                  {isCard ? (
                    <CreditCardIcon
                      className="h-5 w-5"
                      style={{ color: "#5B5EA6" }}
                    />
                  ) : (
                    <PixIcon
                      className="h-5 w-5"
                      style={{ color: "#5B5EA6" }}
                    />
                  )}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#5B5EA6" }}
                  >
                    {isCard ? "Cartão de Crédito" : "PIX"}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(91,94,166,0.70)" }}
                  >
                    {isPaid ? "Pagamento confirmado" : "Aguardando confirmação"}
                  </p>
                </div>
              </div>

              {/* PIX Reference */}
              {isPendingPix && order.pix_reference && (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    background: "rgba(212,167,44,0.08)",
                    borderColor: "rgba(212,167,44,0.25)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <InfoIcon
                      className="mt-0.5 h-5 w-5 shrink-0"
                      style={{ color: "#D4A72C" }}
                    />
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#1A1614" }}
                      >
                        Aguardando Validação
                      </p>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: "rgba(26,22,20,0.60)" }}
                      >
                        O profissional validará seu pagamento em breve. Você
                        receberá uma notificação quando seus créditos forem
                        liberados.
                      </p>
                      <p
                        className="mt-2 font-mono text-xs"
                        style={{ color: "#D4A72C" }}
                      >
                        Ref: {order.pix_reference}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success message */}
              {isPaid && (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    background: "rgba(74,124,89,0.08)",
                    borderColor: "rgba(74,124,89,0.20)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon
                      className="mt-0.5 h-5 w-5 shrink-0"
                      style={{ color: "#4A7C59" }}
                    />
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#1A1614" }}
                      >
                        Créditos Disponíveis
                      </p>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: "rgba(26,22,20,0.60)" }}
                      >
                        Seus créditos foram adicionados e você já pode agendar
                        suas sessões.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex flex-col gap-3">
            {isPaid ? (
              <>
                <Link
                  href="/agenda"
                  className="flex w-full items-center justify-center rounded-2xl py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#4A7C59" }}
                >
                  Agendar Sessão
                </Link>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center rounded-2xl border py-4 text-center text-base font-bold transition-all hover:bg-white"
                  style={{
                    borderColor: "rgba(26,22,20,0.15)",
                    color: "#1A1614",
                  }}
                >
                  Ir para Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center rounded-2xl py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#4A7C59" }}
                >
                  Ir para Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => void loadOrder()}
                  className="flex w-full items-center justify-center rounded-2xl border py-4 text-center text-base font-bold transition-all hover:bg-white"
                  style={{
                    borderColor: "rgba(26,22,20,0.15)",
                    color: "#1A1614",
                  }}
                >
                  Atualizar Status
                </button>
              </>
            )}
          </div>

          {/* Help */}
          <div
            className="rounded-2xl border p-4 text-center"
            style={{
              background: "rgba(255,255,255,0.60)",
              borderColor: "rgba(26,22,20,0.08)",
            }}
          >
            <p className="text-sm" style={{ color: "rgba(26,22,20,0.55)" }}>
              Precisa de ajuda?{" "}
              <a
                href="mailto:suporte@exemplo.com"
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: "#4A7C59" }}
              >
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function CheckCircleIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
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

function ClockIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
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

function AlertIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
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

function CreditCardIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
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

function PixIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.2 6.4L12 9.6 8.8 6.4 6.4 8.8 9.6 12l-3.2 3.2 2.4 2.4L12 14.4l3.2 3.2 2.4-2.4L14.4 12l3.2-3.2z" />
    </svg>
  );
}

function InfoIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
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

function ReceiptIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  );
}
