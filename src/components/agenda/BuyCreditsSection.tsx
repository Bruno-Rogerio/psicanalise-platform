// src/components/agenda/BuyCreditsSection.tsx
"use client";

import { useState, useEffect } from "react";
import { listActiveProducts } from "@/services/products";
import { getCreditsBalance } from "@/services/payments";
import type { Product, AppointmentType, ProductTier } from "@/types/payment";
import { supabase } from "@/lib/supabase-browser";
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
  const [userTier, setUserTier] = useState<ProductTier>("standard");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [professionalId, appointmentType]);

  async function loadData() {
    try {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const tier: ProductTier = auth.user
        ? await supabase
            .from("profiles")
            .select("tier")
            .eq("id", auth.user.id)
            .single()
            .then(({ data }) => (data?.tier as ProductTier) ?? "standard")
        : "standard";

      setUserTier(tier);

      const [prods, balance] = await Promise.all([
        listActiveProducts(professionalId, appointmentType, tier),
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
        <div className="h-6 w-44 animate-pulse rounded-lg bg-[#1A1614]/8" />
        <div className="h-40 animate-pulse rounded-3xl bg-[#1A1614]/6" />
        <div className="h-40 animate-pulse rounded-3xl bg-[#1A1614]/6" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-[#1A1614]/15 bg-[#F2EDE8]/50 p-8 text-center">
        <p className="text-sm text-[#1A1614]/50">
          Nenhum pacote disponível no momento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section title */}
      <h3 className="font-bold text-[#1A1614]">Pacotes de Sessões</h3>

      {/* Products */}
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
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-[#1A1614]/10 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Top section */}
      <div className="p-5 bg-gradient-to-br from-white to-[#F2EDE8]/60">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-[#1A1614]">{product.title}</h4>
            {product.description && (
              <p className="mt-1 text-sm text-[#1A1614]/60">
                {product.description}
              </p>
            )}
            {/* Sessions count pill */}
            <div className="mt-2 inline-flex items-center rounded-full bg-[#4A7C59]/10 px-3 py-1 text-sm font-semibold text-[#4A7C59]">
              {product.sessions_count}{" "}
              {product.sessions_count === 1 ? "sessão" : "sessões"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-[#1A1614]">
              {formatCents(product.price_cents)}
            </p>
            <p className="mt-0.5 text-sm text-[#1A1614]/40">
              {formatCents(product.price_cents / product.sessions_count)}/sessão
            </p>
          </div>
        </div>
      </div>

      {/* Bottom section — always visible, no accordion */}
      <div className="border-t border-[#1A1614]/8 p-4 bg-[#F2EDE8]/30">
        <div className="flex gap-2">
          <button
            onClick={onBuyWithCard}
            className="flex-1 bg-[#1A1614] text-white rounded-2xl py-3 text-sm font-semibold transition-all hover:bg-[#2a2a2a] flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="h-4 w-4" />
            Cartão
          </button>
          <button
            onClick={onBuyWithPix}
            className="flex-1 bg-white border-2 border-[#4A7C59] text-[#4A7C59] rounded-2xl py-3 text-sm font-semibold transition-all hover:bg-[#4A7C59]/5 flex items-center justify-center gap-2"
          >
            <PixIcon className="h-4 w-4" />
            PIX
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-[#1A1614]/35">
          Créditos liberados após confirmação
        </p>
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
