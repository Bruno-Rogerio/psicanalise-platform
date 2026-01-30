// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verifica assinatura do webhook
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );

    // Processa evento
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

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;

  if (!orderId) {
    console.error("No order_id in payment intent metadata");
    return;
  }

  // 1. Atualiza order para paid
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending"); // Só atualiza se ainda estiver pending

  if (updateError) {
    console.error("Error updating order:", updateError);
    return;
  }

  // 2. Adiciona créditos via função RPC
  const { error: creditsError } = await supabase.rpc("add_credits_from_order", {
    p_order_id: orderId,
  });

  if (creditsError) {
    console.error("Error adding credits:", creditsError);
    return;
  }

  console.log(`✅ Payment processed successfully for order ${orderId}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;

  if (!orderId) {
    console.error("No order_id in payment intent metadata");
    return;
  }

  // Atualiza order para failed
  await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);

  console.log(`❌ Payment failed for order ${orderId}`);
}
