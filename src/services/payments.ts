// src/services/payments.ts
import { supabase } from "@/lib/supabase-browser";
import type {
  Order,
  OrderWithItems,
  CreateOrderResponse,
  PaymentMethod,
  SessionCredit,
} from "@/types/payment";

/**
 * Cria order e inicia processo de pagamento
 */
export async function createOrder(
  productId: string,
  paymentMethod: PaymentMethod,
): Promise<CreateOrderResponse> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) throw new Error("Não autenticado");

  const response = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      paymentMethod,
      userId: auth.user.id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao criar pedido");
  }

  return response.json();
}

/**
 * Busca orders do usuário
 */
export async function listMyOrders(): Promise<OrderWithItems[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*),
      product:products(*)
    `,
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as OrderWithItems[];
}

/**
 * Busca order por ID
 */
export async function getOrderById(
  orderId: string,
): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*),
      product:products(*)
    `,
    )
    .eq("id", orderId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as OrderWithItems;
}

/**
 * Busca créditos do usuário com um profissional
 */
export async function getMyCredits(
  professionalId: string,
): Promise<{ video: SessionCredit | null; chat: SessionCredit | null }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("session_credits")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("profissional_id", professionalId)
    .eq("status", "active")
    .in("appointment_type", ["video", "chat"]);

  if (error) throw error;

  const credits = data || [];
  return {
    video: credits.find((c) => c.appointment_type === "video") || null,
    chat: credits.find((c) => c.appointment_type === "chat") || null,
  };
}

/**
 * Busca saldo de créditos disponíveis
 */
export async function getCreditsBalance(
  professionalId: string,
  appointmentType: "video" | "chat",
): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return 0;

  const { data, error } = await supabase
    .from("session_credits")
    .select("total, used")
    .eq("user_id", auth.user.id)
    .eq("profissional_id", professionalId)
    .eq("appointment_type", appointmentType)
    .eq("status", "active")
    .single();

  if (error || !data) return 0;
  return data.total - data.used;
}

/**
 * Cancela order (se ainda não foi paga)
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .in("status", ["pending", "pending_pix"]);

  if (error) throw error;
}
