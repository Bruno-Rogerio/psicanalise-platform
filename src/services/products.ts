// src/services/products.ts
import { supabase } from "@/lib/supabase-browser";
import type { Product, AppointmentType } from "@/types/payment";

export interface CreateProductParams {
  title: string;
  description?: string;
  appointmentType: AppointmentType;
  sessionsCount: number;
  priceCents: number;
}

export interface UpdateProductParams {
  id: string;
  title?: string;
  description?: string;
  sessionsCount?: number;
  priceCents?: number;
  isActive?: boolean;
}

/**
 * Lista produtos do profissional
 */
export async function listProducts(
  professionalId: string,
  appointmentType?: AppointmentType,
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("profissional_id", professionalId)
    .order("sessions_count", { ascending: true });

  if (appointmentType) {
    query = query.eq("appointment_type", appointmentType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Product[];
}

/**
 * Lista produtos ativos de um profissional (para clientes)
 */
export async function listActiveProducts(
  professionalId: string,
  appointmentType: AppointmentType,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("profissional_id", professionalId)
    .eq("appointment_type", appointmentType)
    .eq("is_active", true)
    .order("sessions_count", { ascending: true });

  if (error) throw error;
  return (data || []) as Product[];
}

/**
 * Cria produto (combo de sessões)
 */
export async function createProduct(
  professionalId: string,
  params: CreateProductParams,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      profissional_id: professionalId,
      title: params.title,
      description: params.description || null,
      appointment_type: params.appointmentType,
      sessions_count: params.sessionsCount,
      price_cents: params.priceCents,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

/**
 * Atualiza produto
 */
export async function updateProduct(
  params: UpdateProductParams,
): Promise<Product> {
  const updates: Partial<Product> = {};

  if (params.title !== undefined) updates.title = params.title;
  if (params.description !== undefined)
    updates.description = params.description;
  if (params.sessionsCount !== undefined)
    updates.sessions_count = params.sessionsCount;
  if (params.priceCents !== undefined) updates.price_cents = params.priceCents;
  if (params.isActive !== undefined) updates.is_active = params.isActive;

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

/**
 * Deleta produto (soft delete - marca como inativo)
 */
export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productId);

  if (error) throw error;
}

/**
 * Busca produto por ID
 */
export async function getProductById(
  productId: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data as Product;
}

/**
 * Formata valor em centavos para BRL
 */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte BRL para centavos
 */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}
