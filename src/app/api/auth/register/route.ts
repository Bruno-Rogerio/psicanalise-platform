import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { resolveMx } from "dns/promises";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  sendProfessionalSignupNotification,
  sendVerificationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hasMxRecord(email: string) {
  const domain = email.split("@")[1];
  if (!domain) return false;

  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const nome = String(body.nome ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const senha = String(body.senha ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!nome || nome.length < 2) {
      return NextResponse.json(
        { error: "Nome invalido" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email invalido" },
        { status: 400 },
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 },
      );
    }

    const mxOk = await hasMxRecord(email);
    if (!mxOk) {
      return NextResponse.json(
        { error: "Email nao parece valido (sem MX)" },
        { status: 400 },
      );
    }

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome },
      });

    if (createError || !created.user) {
      const msg = createError?.message?.toLowerCase() || "";
      if (msg.includes("already") || msg.includes("registered")) {
        return NextResponse.json(
          { error: "Este email ja esta cadastrado" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: createError?.message || "Falha ao criar usuario" },
        { status: 500 },
      );
    }

    const user = created.user;

    await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        nome,
        role: "cliente",
        email,
        phone: phone || null,
        status: "pending_email",
        email_verified_at: null,
        deleted_at: null,
      },
      { onConflict: "id" },
    );

    // Create verification token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await supabaseAdmin.from("email_verifications").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      new URL(request.url).origin;

    const verifyUrl = `${origin}/verificar-email?token=${rawToken}`;

    let emailSent = true;
    try {
      await sendVerificationEmail({ to: email, name: nome, verifyUrl });
    } catch {
      emailSent = false;
    }

    try {
      const createdAt = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      await sendProfessionalSignupNotification({
        name: nome,
        email,
        phone: phone || null,
        createdAt,
      });
    } catch {
      // notification is best-effort
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
