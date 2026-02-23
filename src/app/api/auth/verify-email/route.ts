import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token ausente" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const { data, error } = await supabaseAdmin
      .from("email_verifications")
      .select("id,user_id,expires_at,used_at")
      .eq("token_hash", tokenHash)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Token invalido" }, { status: 400 });
    }

    if (data.used_at) {
      return NextResponse.json({ error: "Token ja utilizado" }, { status: 400 });
    }

    const expiresAt = new Date(data.expires_at).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      return NextResponse.json({ error: "Token expirado" }, { status: 400 });
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("email_verifications")
      .update({ used_at: now })
      .eq("id", data.id);

    await supabaseAdmin
      .from("profiles")
      .update({ email_verified_at: now, status: "active" })
      .eq("id", data.user_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
