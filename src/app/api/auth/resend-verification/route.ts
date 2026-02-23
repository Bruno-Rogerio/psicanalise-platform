import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email invalido" },
        { status: 400 },
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id,nome,email_verified_at,status,deleted_at")
      .eq("email", email)
      .single();

    if (
      !profile ||
      profile.email_verified_at ||
      profile.status === "blocked" ||
      profile.deleted_at
    ) {
      // Do not reveal if user exists
      return NextResponse.json({ success: true });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await supabaseAdmin.from("email_verifications").insert({
      user_id: profile.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      new URL(request.url).origin;

    const verifyUrl = `${origin}/verificar-email?token=${rawToken}`;

    await sendVerificationEmail({
      to: email,
      name: profile.nome,
      verifyUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
