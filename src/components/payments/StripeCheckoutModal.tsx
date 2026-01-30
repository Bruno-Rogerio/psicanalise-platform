// src/components/payments/StripeCheckoutModal.tsx
"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { Product } from "@/types/payment";
import { createOrder } from "@/services/payments";
import { formatCents } from "@/services/products";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess: (orderId: string) => void;
}

export function StripeCheckoutModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StripeCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setOrderId(null);
      return;
    }

    // Cria order e payment intent
    (async () => {
      try {
        setLoading(true);
        const response = await createOrder(product.id, "card");
        setClientSecret(response.clientSecret!);
        setOrderId(response.order.id);
      } catch (error: any) {
        console.error("Error creating order:", error);
        alert(error.message || "Erro ao iniciar pagamento");
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, product.id]);

  if (!isOpen) return null;

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#4A7C59",
      colorBackground: "#ffffff",
      colorText: "#111111",
      colorDanger: "#be123c",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "12px",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-warm-200 bg-white text-warm-600 transition-all hover:bg-warm-50 hover:text-warm-900"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-500 shadow-lg">
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-warm-900">
                Pagamento com Cartão
              </h2>
              <p className="mt-1 text-sm text-warm-600">
                Pague de forma segura com Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="border-b border-warm-200 bg-warm-50/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-warm-900">{product.title}</p>
              {product.description && (
                <p className="mt-1 text-sm text-warm-600">
                  {product.description}
                </p>
              )}
              <p className="mt-2 text-xs text-warm-500">
                {product.sessions_count}{" "}
                {product.sessions_count === 1 ? "sessão" : "sessões"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-warm-900">
                {formatCents(product.price_cents)}
              </p>
              <p className="text-xs text-warm-500">à vista</p>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-warm-200 border-t-sage-500" />
              <p className="mt-4 text-sm text-warm-600">
                Preparando checkout...
              </p>
            </div>
          ) : clientSecret && orderId ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance }}
            >
              <CheckoutForm
                orderId={orderId}
                onSuccess={() => onSuccess(orderId)}
                onCancel={onClose}
              />
            </Elements>
          ) : (
            <div className="py-12 text-center text-sm text-warm-600">
              Erro ao carregar checkout
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-warm-200 bg-warm-50/30 p-4">
          <div className="flex items-center justify-center gap-2 text-xs text-warm-500">
            <ShieldIcon className="h-4 w-4" />
            <span>Pagamento seguro processado pela Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Formulário interno com hooks do Stripe
function CheckoutForm({
  orderId,
  onSuccess,
  onCancel,
}: {
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) return;

    try {
      setProcessing(true);
      setError(null);

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Erro ao processar pagamento");
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Erro ao confirmar pagamento");
      } else {
        // Pagamento confirmado!
        onSuccess();
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Erro no pagamento</p>
              <p className="mt-1 text-sm text-rose-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 rounded-xl border-2 border-warm-300 bg-white px-4 py-3 font-semibold text-warm-700 transition-all hover:bg-warm-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="group relative flex-1 overflow-hidden rounded-xl bg-sage-500 px-4 py-3 font-semibold text-white transition-all hover:bg-sage-600 disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <LockIcon className="h-5 w-5" />
              Pagar {/* valor será mostrado no product info */}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4">
        <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <p className="text-xs leading-relaxed text-blue-900">
          Após o pagamento, seus créditos serão liberados automaticamente e você
          poderá agendar suas sessões.
        </p>
      </div>
    </form>
  );
}

// Icons
function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
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

function ShieldIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
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
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
