// src/components/payments/PixCheckoutModal.tsx
"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import type { Product } from "@/types/payment";
import { createOrder } from "@/services/payments";
import { formatCents } from "@/services/products";

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess: (orderId: string) => void;
}

export function PixCheckoutModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: PixCheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    reference: string;
    amount: number;
    orderId: string;
    qrCodeUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPixData(null);
      return;
    }

    // Cria order PIX
    (async () => {
      try {
        setLoading(true);
        const response = await createOrder(product.id, "pix");

        // Gera QR Code
        const pixPayload = generatePixPayload({
          reference: response.pixData!.reference,
          amount: response.pixData!.amount,
          name: "Plataforma de Psicanálise", // Você pode pegar do perfil do profissional
        });

        const qrCodeUrl = await QRCode.toDataURL(pixPayload, {
          width: 300,
          margin: 2,
          color: {
            dark: "#111111",
            light: "#FFFFFF",
          },
        });

        setPixData({
          reference: response.pixData!.reference,
          amount: response.pixData!.amount,
          orderId: response.order.id,
          qrCodeUrl,
        });
      } catch (error: any) {
        console.error("Error creating PIX order:", error);
        alert(error.message || "Erro ao gerar PIX");
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, product.id]);

  async function copyPixCode() {
    if (!pixData) return;

    const pixPayload = generatePixPayload({
      reference: pixData.reference,
      amount: pixData.amount,
      name: "Plataforma de Psicanálise",
    });

    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  function handleConfirm() {
    if (pixData) {
      onSuccess(pixData.orderId);
    }
  }

  if (!isOpen) return null;

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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
              <PixIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-warm-900">
                Pagamento via PIX
              </h2>
              <p className="mt-1 text-sm text-warm-600">
                Pague instantaneamente pelo seu banco
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
              <p className="text-xs text-warm-500">via PIX</p>
            </div>
          </div>
        </div>

        {/* PIX Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-warm-200 border-t-emerald-500" />
              <p className="mt-4 text-sm text-warm-600">Gerando QR Code...</p>
            </div>
          ) : pixData ? (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="overflow-hidden rounded-2xl border-4 border-warm-200 bg-white p-4 shadow-lg">
                  <img
                    src={pixData.qrCodeUrl}
                    alt="QR Code PIX"
                    className="h-64 w-64"
                  />
                </div>
                <p className="mt-4 text-sm font-semibold text-warm-700">
                  Escaneie o QR Code para pagar
                </p>
              </div>

              {/* Copy Code */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-warm-700">
                  Ou copie o código PIX
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixData.reference}
                    readOnly
                    className="flex-1 rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-600"
                  />
                  <button
                    onClick={copyPixCode}
                    className="group relative overflow-hidden rounded-xl bg-warm-900 px-6 py-3 font-semibold text-white transition-all hover:bg-warm-800"
                  >
                    {copied ? (
                      <span className="flex items-center gap-2">
                        <CheckIcon className="h-5 w-5" />
                        Copiado!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CopyIcon className="h-5 w-5" />
                        Copiar
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-700">
                    1
                  </div>
                  <p className="text-sm text-blue-900">
                    Abra o app do seu banco e escolha pagar com PIX
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-700">
                    2
                  </div>
                  <p className="text-sm text-blue-900">
                    Escaneie o QR Code ou cole o código PIX
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-700">
                    3
                  </div>
                  <p className="text-sm text-blue-900">
                    Confirme o pagamento e aguarde a validação
                  </p>
                </div>
              </div>

              {/* Reference */}
              <div className="rounded-xl bg-warm-50 p-4">
                <p className="text-xs font-semibold text-warm-500">
                  Referência do pedido
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-warm-900">
                  {pixData.reference}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border-2 border-warm-300 bg-white px-4 py-3 font-semibold text-warm-700 transition-all hover:bg-warm-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
                >
                  Já paguei
                </button>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-4">
                <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Aguarde a validação
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-700">
                    Após o pagamento, o profissional validará manualmente e seus
                    créditos serão liberados. Você receberá uma notificação
                    quando isso acontecer.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-warm-600">
              Erro ao gerar PIX
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Gera payload PIX (formato simplificado)
// Em produção, use uma lib como pix-utils para gerar o payload correto
function generatePixPayload({
  reference,
  amount,
  name,
}: {
  reference: string;
  amount: number;
  name: string;
}): string {
  // Formato simplificado para demonstração
  // Em produção, use uma biblioteca adequada
  return `00020126580014br.gov.bcb.pix0136${reference}520400005303986540${amount.toFixed(2)}5802BR5925${name}6009SAO PAULO62070503***6304`;
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

function PixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.2 6.4L12 9.6 8.8 6.4 6.4 8.8 9.6 12l-3.2 3.2 2.4 2.4L12 14.4l3.2 3.2 2.4-2.4L14.4 12l3.2-3.2z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
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
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
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
