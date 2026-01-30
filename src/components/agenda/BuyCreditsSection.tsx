// src/components/agenda/BuyCreditsSection.tsx
"use client";

import { useState, useEffect } from "react";
import { listActiveProducts } from "@/services/products";
import { getCreditsBalance } from "@/services/payments";
import type { Product, AppointmentType } from "@/types/payment";
import { formatCents } from "@/services/products";
import { StripeCheckoutModal } from "@/components/payments/StripeCheckoutModal";
import { PixCheckoutModal } from "@/components/payments/PixCheckoutModal";
import { useRouter } from "next/navigation";

interface BuyCreditsProps {
  professionalId: string;
  appointmentType: AppointmentType;
  onCreditsUpdated?: () => void;
}

export function BuyCreditsSection({
  professionalId,
  appointmentType,
  onCreditsUpdated,
}: BuyCreditsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [credits, setCredits] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [professionalId, appointmentType]);

  async function loadData() {
    try {
      setLoading(true);
      const [prods, balance] = await Promise.all([
        listActiveProducts(professionalId, appointmentType),
        getCreditsBalance(professionalId, appointmentType),
      ]);
      setProducts(prods);
      setCredits(balance);
    } catch (error: any) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleBuyWithCard(product: Product) {
    setSelectedProduct(product);
    setShowStripeModal(true);
  }

  function handleBuyWithPix(product: Product) {
    setSelectedProduct(product);
    setShowPixModal(true);
  }

  function handlePaymentSuccess(orderId: string) {
    setShowStripeModal(false);
    setShowPixModal(false);
    router.push(`/checkout/success?order_id=${orderId}`);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-warm-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-warm-200" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 p-6 text-center">
        <p className="text-sm text-warm-600">
          Nenhum pacote disponível no momento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Credits Balance */}
      <div className="rounded-xl border-2 border-sage-200 bg-sage-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-sage-700">Seus Créditos</p>
            <p className="mt-1 text-xs text-sage-600">
              {appointmentType === "video"
                ? "Sessões de vídeo"
                : "Sessões de chat"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-sage-700">{credits}</p>
            <p className="text-xs text-sage-600">
              {credits === 1 ? "sessão" : "sessões"}
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div>
        <h3 className="mb-3 font-semibold text-warm-900">
          Comprar Pacotes de Sessões
        </h3>
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuyWithCard={() => handleBuyWithCard(product)}
              onBuyWithPix={() => handleBuyWithPix(product)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {selectedProduct && (
        <>
          <StripeCheckoutModal
            isOpen={showStripeModal}
            onClose={() => setShowStripeModal(false)}
            product={selectedProduct}
            onSuccess={handlePaymentSuccess}
          />
          <PixCheckoutModal
            isOpen={showPixModal}
            onClose={() => setShowPixModal(false)}
            product={selectedProduct}
            onSuccess={handlePaymentSuccess}
          />
        </>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onBuyWithCard,
  onBuyWithPix,
}: {
  product: Product;
  onBuyWithCard: () => void;
  onBuyWithPix: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-warm-200 bg-white shadow-soft transition-all hover:shadow-soft-lg">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left transition-colors hover:bg-warm-50"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-bold text-warm-900">{product.title}</h4>
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
          <div className="ml-4 text-right">
            <p className="text-xl font-bold text-warm-900">
              {formatCents(product.price_cents)}
            </p>
            <p className="mt-1 text-xs text-sage-600">
              {formatCents(product.price_cents / product.sessions_count)}/sessão
            </p>
          </div>
        </div>
      </button>

      {/* Actions (expandable) */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-40" : "max-h-0"
        }`}
      >
        <div className="border-t-2 border-warm-200 bg-warm-50/50 p-4">
          <div className="flex gap-2">
            <button
              onClick={onBuyWithCard}
              className="flex-1 rounded-xl bg-[#111111] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2a2a2a]"
            >
              <span className="flex items-center justify-center gap-2">
                <CreditCardIcon className="h-4 w-4" />
                Cartão
              </span>
            </button>
            <button
              onClick={onBuyWithPix}
              className="flex-1 rounded-xl border-2 border-warm-300 bg-white px-4 py-3 text-sm font-semibold text-[#111111] transition-all hover:bg-warm-50"
            >
              <span className="flex items-center justify-center gap-2">
                <PixIcon className="h-4 w-4" />
                PIX
              </span>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-warm-500">
            Créditos liberados após confirmação
          </p>
        </div>
      </div>
    </div>
  );
}

// Icons
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
