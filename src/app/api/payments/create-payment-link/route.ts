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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount_cents, description, profissional_id } = body;

    if (!amount_cents || !description || !profissional_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios: amount_cents, description, profissional_id" },
        { status: 400 },
      );
    }

    if (amount_cents < 100) {
      return NextResponse.json(
        { error: "Valor mínimo é R$ 1,00" },
        { status: 400 },
      );
    }

    // 1. Cria Price no Stripe (avulso, sem recorrência)
    const price = await stripe.prices.create({
      currency: "brl",
      unit_amount: amount_cents,
      product_data: {
        name: description,
      },
    });

    // 2. Cria Payment Link no Stripe
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        profissional_id,
        source: "payment_link",
      },
    });

    // 3. Salva no banco
    const { data, error } = await supabase
      .from("payment_links")
      .insert({
        profissional_id,
        description,
        amount_cents,
        stripe_price_id: price.id,
        stripe_payment_link_id: paymentLink.id,
        url: paymentLink.url,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ paymentLink: data });
  } catch (error: any) {
    console.error("Erro ao criar payment link:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 },
    );
  }
}
