// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  // ✅ 400 só para erro de assinatura (Stripe NÃO deve retentar isso se a config estiver errada)
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature error:", err?.message);
    return NextResponse.json(
      { error: `Invalid signature: ${err?.message ?? "unknown"}` },
      { status: 400 },
    );
  }

  // ✅ Aqui: se der erro no processamento, retornar 500 para Stripe retentar
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Webhook handler error" },
      { status: 500 },
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    throw new Error("No order_id in payment intent metadata");
  }

  // ✅ Idempotência: se já está paid, não roda de novo
  const { data: existingOrder, error: readErr } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (readErr) throw readErr;

  if (!existingOrder) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (existingOrder.status === "paid") {
    console.log(`ℹ️ Order already paid, skipping: ${orderId}`);
    return;
  }

  // 1) Atualiza order para paid
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  // 2) Adiciona créditos via RPC
  const { error: creditsError } = await supabase.rpc("add_credits_from_order", {
    p_order_id: orderId,
  });

  if (creditsError) throw creditsError;

  console.log(`✅ Payment processed successfully for order ${orderId}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    throw new Error("No order_id in payment intent metadata");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "failed",
      stripe_payment_intent_id: paymentIntent.id,
      failed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw error;

  console.log(`❌ Payment failed for order ${orderId}`);
}
