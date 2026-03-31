// src/app/profissional/produtos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase-browser";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  formatCents,
  toCents,
  type CreateProductParams,
} from "@/services/products";
import type { Product, AppointmentType } from "@/types/payment";

export default function ProdutosPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    appointmentType: "video" as AppointmentType,
    sessionsCount: 1,
    priceReais: "0",
    tier: "standard" as "standard" | "popular",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) return;

      setProfessionalId(auth.user.id);
      const prods = await listProducts(auth.user.id);
      setProducts(prods);
    } catch (error: any) {
      console.error("Erro ao carregar produtos:", error);
      toast(error.message || "Erro ao carregar produtos", "error");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingProduct(null);
    setFormData({
      title: "",
      description: "",
      appointmentType: "video",
      sessionsCount: 1,
      priceReais: "0",
      tier: "standard",
    });
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || "",
      appointmentType: product.appointment_type,
      sessionsCount: product.sessions_count,
      priceReais: (product.price_cents / 100).toFixed(2),
      tier: product.tier ?? "standard",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!professionalId) return;

    try {
      setModalBusy(true);

      const priceCents = toCents(parseFloat(formData.priceReais));

      if (editingProduct) {
        // Update
        await updateProduct({
          id: editingProduct.id,
          title: formData.title,
          description: formData.description || undefined,
          sessionsCount: formData.sessionsCount,
          priceCents,
          tier: formData.tier,
        });
      } else {
        // Create
        await createProduct(professionalId, {
          title: formData.title,
          description: formData.description || undefined,
          appointmentType: formData.appointmentType,
          sessionsCount: formData.sessionsCount,
          priceCents,
          tier: formData.tier,
        });
      }

      setShowModal(false);
      loadProducts();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast(error.message || "Erro ao salvar produto", "error");
    } finally {
      setModalBusy(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("Tem certeza que deseja desativar este produto?")) return;

    try {
      await deleteProduct(productId);
      loadProducts();
    } catch (error: any) {
      console.error("Erro ao deletar produto:", error);
      toast(error.message || "Erro ao deletar produto", "error");
    }
  }

  async function handleToggleActive(product: Product) {
    try {
      await updateProduct({
        id: product.id,
        isActive: !product.is_active,
      });
      loadProducts();
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      toast(error.message || "Erro ao atualizar produto", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-3xl bg-[#F8F4F1]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-[#F8F4F1]" />
          ))}
        </div>
      </div>
    );
  }

  const videoProducts = products.filter((p) => p.appointment_type === "video");
  const chatProducts = products.filter((p) => p.appointment_type === "chat");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Profissional</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-[#8B7B72]">Pacotes de sessões disponíveis</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2A2320]"
        >
          <PlusIcon className="h-4 w-4" />
          Novo Produto
        </button>
      </div>

      {/* Video Products */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50">
            <VideoIcon className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <h2 className="font-bold text-[#2C2420]">Sessões de Vídeo</h2>
            <p className="text-xs text-[#8B7B72]">{videoProducts.length} produto(s)</p>
          </div>
        </div>

        {videoProducts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#E8E0DC] bg-[#F8F4F1] p-8 text-center">
            <VideoIcon className="mx-auto h-10 w-10 text-[#B0A098]" />
            <p className="mt-4 font-semibold text-[#2C2420]">Nenhum produto de vídeo</p>
            <p className="mt-1 text-sm text-[#8B7B72]">Crie um pacote de sessões por videochamada</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videoProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => openEditModal(product)}
                onDelete={() => handleDelete(product.id)}
                onToggleActive={() => handleToggleActive(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Chat Products */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
            <ChatIcon className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-[#2C2420]">Sessões de Chat</h2>
            <p className="text-xs text-[#8B7B72]">{chatProducts.length} produto(s)</p>
          </div>
        </div>

        {chatProducts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#E8E0DC] bg-[#F8F4F1] p-8 text-center">
            <ChatIcon className="mx-auto h-10 w-10 text-[#B0A098]" />
            <p className="mt-4 font-semibold text-[#2C2420]">Nenhum produto de chat</p>
            <p className="mt-1 text-sm text-[#8B7B72]">Crie um pacote de sessões por chat</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chatProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => openEditModal(product)}
                onDelete={() => handleDelete(product.id)}
                onToggleActive={() => handleToggleActive(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          busy={modalBusy}
        />
      )}
    </div>
  );
}

// ===== COMPONENTS =====

function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const isVideo = product.appointment_type === "video";

  return (
    <div
      className={`rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)] overflow-hidden transition-opacity ${
        product.is_active ? "" : "opacity-60"
      }`}
    >
      <div className="p-6">
        {/* Top row: type + tier badges */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              isVideo
                ? "bg-rose-50 text-rose-700"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {isVideo ? "Vídeo" : "Chat"}
          </span>
          {product.tier === "popular" ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Popular
            </span>
          ) : (
            <span className="rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]">
              Padrão
            </span>
          )}
          <span
            className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
              product.is_active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#F5F0ED] text-[#8B7B72]"
            }`}
          >
            {product.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[#2C2420]">{product.title}</h3>

        {/* Description */}
        {product.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-[#8B7B72] line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price + sessions */}
        <div className="mt-4 border-t border-[#E8E0DC] pt-4">
          <p className="text-2xl font-bold text-[#2C2420]">
            {formatCents(product.price_cents)}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-[#8B7B72]">
              {product.sessions_count}{" "}
              {product.sessions_count === 1 ? "sessão" : "sessões"}
            </p>
            <p className="text-xs font-semibold text-[#4A7C59]">
              {formatCents(product.price_cents / product.sessions_count)}/sessão
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-2xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm font-semibold text-[#2C2420] hover:bg-[#F8F4F1]"
          >
            Editar
          </button>
          <button
            onClick={onToggleActive}
            className="flex-1 rounded-2xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm font-semibold text-[#4A7C59] hover:bg-[#F8F4F1]"
          >
            {product.is_active ? "Desativar" : "Ativar"}
          </button>
          <button
            onClick={onDelete}
            className="rounded-2xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({
  product,
  formData,
  onChange,
  onSubmit,
  onClose,
  busy,
}: {
  product: Product | null;
  formData: any;
  onChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#E8E0DC] bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-[#E8E0DC] px-6 py-5">
          <h2 className="text-lg font-bold text-[#2C2420]">
            {product ? "Editar Produto" : "Novo Produto"}
          </h2>
          <p className="mt-0.5 text-sm text-[#8B7B72]">Configure os detalhes do pacote de sessões</p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          <div className="space-y-4 p-6">
            {/* Tipo (só no create) */}
            {!product && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                  Tipo de Sessão
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...formData, appointmentType: "video" })}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      formData.appointmentType === "video"
                        ? "border-rose-300 bg-rose-50"
                        : "border-[#E8E0DC] bg-white hover:bg-[#F8F4F1]"
                    }`}
                  >
                    <VideoIcon className="h-5 w-5 text-rose-600" />
                    <p className="mt-2 text-sm font-semibold text-[#2C2420]">Vídeo</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...formData, appointmentType: "chat" })}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      formData.appointmentType === "chat"
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-[#E8E0DC] bg-white hover:bg-[#F8F4F1]"
                    }`}
                  >
                    <ChatIcon className="h-5 w-5 text-indigo-600" />
                    <p className="mt-2 text-sm font-semibold text-[#2C2420]">Chat</p>
                  </button>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onChange({ ...formData, title: e.target.value })}
                placeholder="Ex: Pacote 4 Sessões"
                required
                className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onChange({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional do produto"
                rows={3}
                className="w-full resize-none rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
              />
            </div>

            {/* Tier */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                Público-alvo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, tier: "standard" })}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    formData.tier === "standard"
                      ? "border-[#4A7C59] bg-emerald-50"
                      : "border-[#E8E0DC] bg-white hover:bg-[#F8F4F1]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#2C2420]">Padrão</p>
                  <p className="mt-0.5 text-xs text-[#8B7B72]">Todos os pacientes</p>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, tier: "popular" })}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    formData.tier === "popular"
                      ? "border-amber-400 bg-amber-50"
                      : "border-[#E8E0DC] bg-white hover:bg-[#F8F4F1]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#2C2420]">Popular</p>
                  <p className="mt-0.5 text-xs text-[#8B7B72]">Apenas com código promo</p>
                </button>
              </div>
            </div>

            {/* Sessions Count + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                  Nº de Sessões *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sessionsCount}
                  onChange={(e) =>
                    onChange({ ...formData, sessionsCount: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                  Preço Total (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceReais}
                  onChange={(e) => onChange({ ...formData, priceReais: e.target.value })}
                  placeholder="0.00"
                  required
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                />
              </div>
            </div>

            {/* Per-session value info */}
            {formData.sessionsCount > 0 && parseFloat(formData.priceReais) > 0 && (
              <div className="rounded-2xl bg-[#F8F4F1] px-4 py-3">
                <p className="text-sm text-[#8B7B72]">
                  <span className="font-semibold text-[#4A7C59]">Valor por sessão:</span>{" "}
                  {formatCents(toCents(parseFloat(formData.priceReais)) / formData.sessionsCount)}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E8E0DC] bg-[#FAFAF8] px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-2xl border border-[#E8E0DC] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2420] hover:bg-[#F8F4F1] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl bg-[#4A7C59] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d6649] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Salvando..." : product ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== ICONS =====

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
