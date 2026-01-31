// src/app/api/payments/validate-pix/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 Starting validate-pix API");

    const body = await request.json();
    console.log("📦 Request body:", body);

    const { orderId, professionalId } = body;

    if (!orderId || !professionalId) {
      console.error("❌ Missing fields:", { orderId, professionalId });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    // Chama função RPC que valida PIX e adiciona créditos
    const { data, error } = await supabase.rpc("validate_pix_payment", {
      p_order_id: orderId,
      p_professional_id: professionalId,
    });

    if (error) {
      console.error("Validate PIX error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to validate payment" },
        { status: 400 },
      );
    }
    console.log("✅ PIX validated successfully");
    return NextResponse.json({
      success: true,
      message: "Pagamento validado e créditos adicionados com sucesso!",
      data,
    });
  } catch (error: any) {
    console.error("Validate PIX error:", error);
    console.error("💥 Fatal error in validate-pix:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
