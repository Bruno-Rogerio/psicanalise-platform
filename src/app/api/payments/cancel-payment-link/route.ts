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
    const { id, profissional_id } = await request.json();

    if (!id || !profissional_id) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Busca o link garantindo que pertence ao profissional
    const { data: link, error: fetchError } = await supabase
      .from("payment_links")
      .select("id, stripe_payment_link_id, status")
      .eq("id", id)
      .eq("profissional_id", profissional_id)
      .single();

    if (fetchError || !link) {
      return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    if (link.status !== "active") {
      return NextResponse.json({ error: "Apenas links ativos podem ser cancelados" }, { status: 400 });
    }

    // Desativa no Stripe
    if (link.stripe_payment_link_id) {
      await stripe.paymentLinks.update(link.stripe_payment_link_id, { active: false });
    }

    // Atualiza no banco
    const { error: updateError } = await supabase
      .from("payment_links")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Erro ao cancelar payment link:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
