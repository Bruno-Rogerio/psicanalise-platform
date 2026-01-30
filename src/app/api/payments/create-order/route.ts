// src/app/api/payments/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { randomBytes } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role para bypass RLS
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, paymentMethod, userId } = body;

    if (!productId || !paymentMethod || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Busca produto
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 2. Cria order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        profissional_id: product.profissional_id,
        product_id: productId,
        status: paymentMethod === "pix" ? "pending_pix" : "pending",
        amount_cents: product.price_cents,
        payment_method: paymentMethod,
        pix_reference: paymentMethod === "pix" ? generatePixReference() : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    // 3. Cria order item
    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      title: product.title,
      sessions_count: product.sessions_count,
      price_cents: product.price_cents,
    });

    // 4. Processa pagamento
    if (paymentMethod === "card") {
      // STRIPE - Cria Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: product.price_cents,
        currency: "brl",
        metadata: {
          order_id: order.id,
          product_id: product.id,
          user_id: userId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Salva payment intent ID
      await supabase
        .from("orders")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", order.id);

      return NextResponse.json({
        order,
        clientSecret: paymentIntent.client_secret,
      });
    } else {
      // PIX - Retorna dados para gerar QR Code no frontend
      return NextResponse.json({
        order,
        pixData: {
          reference: order.pix_reference,
          amount: product.price_cents / 100,
          orderId: order.id,
        },
      });
    }
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// Gera referência única para PIX
function generatePixReference(): string {
  return `PIX${Date.now()}${randomBytes(4).toString("hex").toUpperCase()}`;
}
