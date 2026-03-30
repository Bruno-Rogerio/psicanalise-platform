import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verifica que é profissional
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "profissional") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { patientId, tier } = await request.json();

    if (!patientId || !["standard", "popular"].includes(tier)) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ tier })
      .eq("id", patientId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
