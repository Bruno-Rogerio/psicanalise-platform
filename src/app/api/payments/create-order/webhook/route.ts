// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Aceitar métodos auxiliares evita 405 em checks/HEAD/OPTIONS
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Pode alinhar com o dashboard depois, mas isso não causa 405
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

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature error:", err?.message);
    return NextResponse.json(
      { error: `Invalid signature: ${err?.message ?? "unknown"}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    // ✅ 500 faz a Stripe retentar corretamente
    return NextResponse.json(
      { error: err?.message ?? "Webhook handler error" },
      { status: 500 },
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  // Payment links não têm order_id — ignorar silenciosamente
  if (!orderId) {
    console.log("ℹ️ payment_intent sem order_id (provavelmente payment link), ignorando");
    return;
  }

  // Idempotência (se já pagou, não repete)
  const { data: existingOrder, error: readErr } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (readErr) throw readErr;
  if (!existingOrder) throw new Error(`Order not found: ${orderId}`);

  if (existingOrder.status === "paid") {
    console.log(`ℹ️ Order already paid, skipping: ${orderId}`);
    return;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  const { error: creditsError } = await supabase.rpc("add_credits_from_order", {
    p_order_id: orderId,
  });

  if (creditsError) throw creditsError;

  console.log(`✅ Payment processed successfully for order ${orderId}`);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.payment_link) return; // Ignora sessions que não vieram de payment link
  if (session.payment_status !== "paid") return;

  // payment_link pode ser string (ID) ou objeto expandido — extrai sempre o ID
  const paymentLinkId =
    typeof session.payment_link === "string"
      ? session.payment_link
      : (session.payment_link as Stripe.PaymentLink).id;

  console.log(`🔵 Checkout session completed, payment_link ID: ${paymentLinkId}`);

  const { error } = await supabase.rpc("mark_payment_link_paid", {
    p_stripe_payment_link_id: paymentLinkId,
    p_stripe_checkout_session_id: session.id,
  });

  if (error) throw new Error(`RPC mark_payment_link_paid error: ${JSON.stringify(error)}`);

  console.log(`✅ Payment link marcado como pago: ${paymentLinkId}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) throw new Error("No order_id in payment intent metadata");

  const { error } = await supabase
    .from("orders")
    .update({
      status: "failed",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("id", orderId);

  if (error) throw error;

  console.log(`❌ Payment failed for order ${orderId}`);
}
