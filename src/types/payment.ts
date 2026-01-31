// src/types/payment.ts

export type PaymentMethod = "card" | "pix";

export type OrderStatus =
  | "pending" // Aguardando pagamento com cartão
  | "pending_pix" // Aguardando validação PIX
  | "paid" // Pago e processado
  | "failed" // Falhou
  | "cancelled" // Cancelado
  | "refunded"; // Reembolsado

export type CreditStatus = "active" | "consumed" | "refunded";

export type AppointmentType = "video" | "chat";

export interface Product {
  id: string;
  profissional_id: string;
  title: string;
  description: string | null;
  appointment_type: AppointmentType;
  sessions_count: number;
  price_cents: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  profissional_id: string;
  product_id: string;
  status: OrderStatus;
  amount_cents: number;
  payment_method: PaymentMethod | null;
  stripe_payment_intent_id: string | null;
  pix_reference: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  sessions_count: number;
  price_cents: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  product?: Product;
}

export interface SessionCredit {
  id: string;
  user_id: string;
  profissional_id: string;
  appointment_type: AppointmentType;
  total: number;
  used: number;
  order_id: string | null;
  created_at: string;
  status: CreditStatus;
}

export interface CreateOrderParams {
  productId: string;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
  order: Order;
  clientSecret?: string; // Para Stripe
  pixData?: {
    reference: string;
    qrCode: string;
    amount: number;
    orderId: string;
    pixCopyPaste?: string;
  };
}

export interface StripePaymentIntentResponse {
  clientSecret: string;
  amount: number;
}
