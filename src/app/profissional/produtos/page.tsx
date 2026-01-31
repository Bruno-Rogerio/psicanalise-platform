// src/app/profissional/produtos/page.tsx
"use client";

import { useEffect, useState } from "react";
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
      alert(error.message || "Erro ao carregar produtos");
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
        });
      } else {
        // Create
        await createProduct(professionalId, {
          title: formData.title,
          description: formData.description || undefined,
          appointmentType: formData.appointmentType,
          sessionsCount: formData.sessionsCount,
          priceCents,
        });
      }

      setShowModal(false);
      loadProducts();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      alert(error.message || "Erro ao salvar produto");
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
      alert(error.message || "Erro ao deletar produto");
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
      alert(error.message || "Erro ao atualizar produto");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-warm-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-warm-200"
            />
          ))}
        </div>
      </div>
    );
  }

  const videoProducts = products.filter((p) => p.appointment_type === "video");
  const chatProducts = products.filter((p) => p.appointment_type === "chat");

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
            <PackageIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900 sm:text-3xl">
              Produtos e Pacotes
            </h1>
            <p className="mt-1 text-warm-600">
              Configure os combos de sessões que seus clientes podem comprar
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-sage-500 bg-white px-6 py-3 text-sm font-semibold text-sage-600 transition-all hover:bg-sage-50"
        >
          <PlusIcon className="h-5 w-5" />
          Novo Produto
        </button>
      </header>

      {/* Video Products */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
            <VideoIcon className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h2 className="font-bold text-warm-900">Sessões de Vídeo</h2>
            <p className="text-sm text-warm-600">
              {videoProducts.length} produto(s)
            </p>
          </div>
        </div>

        {videoProducts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 p-8 text-center">
            <VideoIcon className="mx-auto h-12 w-12 text-warm-300" />
            <p className="mt-4 font-semibold text-warm-700">
              Nenhum produto de vídeo
            </p>
            <p className="mt-1 text-sm text-warm-500">
              Crie um pacote de sessões por videochamada
            </p>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <ChatIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-warm-900">Sessões de Chat</h2>
            <p className="text-sm text-warm-600">
              {chatProducts.length} produto(s)
            </p>
          </div>
        </div>

        {chatProducts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 p-8 text-center">
            <ChatIcon className="mx-auto h-12 w-12 text-warm-300" />
            <p className="mt-4 font-semibold text-warm-700">
              Nenhum produto de chat
            </p>
            <p className="mt-1 text-sm text-warm-500">
              Crie um pacote de sessões por chat
            </p>
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
      className={`group relative overflow-hidden rounded-2xl border-2 bg-white shadow-soft transition-all hover:shadow-soft-lg ${
        product.is_active ? "border-warm-200" : "border-warm-200 opacity-60"
      }`}
    >
      {/* Status badge */}
      <div className="absolute right-3 top-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-semibold ${
            product.is_active
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-warm-200 bg-warm-50 text-warm-600"
          }`}
        >
          {product.is_active ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ativo
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-warm-400" />
              Inativo
            </>
          )}
        </span>
      </div>

      <div className="p-6">
        {/* Icon */}
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            isVideo ? "bg-rose-100" : "bg-indigo-100"
          }`}
        >
          {isVideo ? (
            <VideoIcon className="h-6 w-6 text-rose-600" />
          ) : (
            <ChatIcon className="h-6 w-6 text-indigo-600" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-warm-900">{product.title}</h3>

        {/* Description */}
        {product.description && (
          <p className="mt-2 text-sm leading-relaxed text-warm-600">
            {product.description}
          </p>
        )}

        {/* Info */}
        <div className="mt-4 flex items-end justify-between border-t border-warm-200 pt-4">
          <div>
            <p className="text-2xl font-bold text-warm-900">
              {formatCents(product.price_cents)}
            </p>
            <p className="text-xs text-warm-500">
              {product.sessions_count}{" "}
              {product.sessions_count === 1 ? "sessão" : "sessões"}
            </p>
          </div>
          <p className="text-sm font-semibold text-sage-600">
            {formatCents(product.price_cents / product.sessions_count)}/sessão
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg border-2 border-warm-300 bg-white px-4 py-2 text-sm font-semibold text-warm-700 transition-all hover:bg-warm-50"
          >
            Editar
          </button>
          <button
            onClick={onToggleActive}
            className="flex-1 rounded-lg border-2 border-sage-200 bg-sage-50 px-4 py-2 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-100"
          >
            {product.is_active ? "Desativar" : "Ativar"}
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border-2 border-rose-200 bg-rose-50 p-2 text-rose-600 transition-all hover:bg-rose-100"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border-2 border-warm-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b-2 border-warm-200 bg-gradient-to-r from-warm-50 to-white p-6">
          <h2 className="text-xl font-bold text-warm-900">
            {product ? "Editar Produto" : "Novo Produto"}
          </h2>
          <p className="mt-1 text-sm text-warm-600">
            Configure os detalhes do pacote de sessões
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Tipo (só no create) */}
          {!product && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-warm-700">
                Tipo de Sessão
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...formData, appointmentType: "video" })
                  }
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    formData.appointmentType === "video"
                      ? "border-rose-400 bg-rose-50"
                      : "border-warm-200 bg-white hover:bg-warm-50"
                  }`}
                >
                  <VideoIcon className="h-5 w-5 text-rose-600" />
                  <p className="mt-2 text-sm font-semibold text-warm-900">
                    Vídeo
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...formData, appointmentType: "chat" })
                  }
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    formData.appointmentType === "chat"
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-warm-200 bg-white hover:bg-warm-50"
                  }`}
                >
                  <ChatIcon className="h-5 w-5 text-indigo-600" />
                  <p className="mt-2 text-sm font-semibold text-warm-900">
                    Chat
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onChange({ ...formData, title: e.target.value })}
              placeholder="Ex: Pacote 4 Sessões"
              required
              className="w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none transition-all focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-warm-700">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                onChange({ ...formData, description: e.target.value })
              }
              placeholder="Descrição opcional do produto"
              rows={3}
              className="w-full resize-none rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none transition-all focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100"
            />
          </div>

          {/* Sessions Count + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-warm-700">
                Nº de Sessões *
              </label>
              <input
                type="number"
                min="1"
                value={formData.sessionsCount}
                onChange={(e) =>
                  onChange({
                    ...formData,
                    sessionsCount: parseInt(e.target.value) || 1,
                  })
                }
                required
                className="w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none transition-all focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-warm-700">
                Preço Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.priceReais}
                onChange={(e) =>
                  onChange({ ...formData, priceReais: e.target.value })
                }
                placeholder="0.00"
                required
                className="w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none transition-all focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100"
              />
            </div>
          </div>

          {/* Info */}
          {formData.sessionsCount > 0 &&
            parseFloat(formData.priceReais) > 0 && (
              <div className="rounded-xl bg-sage-50 p-4">
                <p className="text-sm text-sage-700">
                  <span className="font-semibold">Valor por sessão:</span>{" "}
                  {formatCents(
                    toCents(parseFloat(formData.priceReais)) /
                      formData.sessionsCount,
                  )}
                </p>
              </div>
            )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-xl border-2 border-warm-300 bg-white px-4 py-3 font-semibold text-warm-700 transition-all hover:bg-warm-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-sage-600 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-sage-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Salvando..." : product ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== ICONS =====

function PackageIcon({ className }: { className?: string }) {
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
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
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
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
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
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
