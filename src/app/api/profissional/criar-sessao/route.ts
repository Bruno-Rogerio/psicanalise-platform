import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

function generatePassword(): string {
  // Formato legível: ex. "Psi4a7f2c9b"
  return "Psi" + randomBytes(4).toString("hex");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendAccessEmail(params: {
  to: string;
  name: string;
  password: string;
  sessionDate: string;
  sessionTime: string;
  sessionType: string;
  loginUrl: string;
}) {
  const typeLabel = params.sessionType === "video" ? "Videochamada" : "Chat";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #2C2420;">
      <h2 style="color: #1A1614;">Bem-vinda, ${params.name}!</h2>
      <p>Sua sessão foi agendada. Aqui estão seus dados de acesso à plataforma:</p>

      <div style="background: #F8F4F1; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>E-mail:</strong> ${params.to}</p>
        <p style="margin: 0 0 8px;"><strong>Senha:</strong> ${params.password}</p>
        <p style="margin: 0;"><strong>Acesso:</strong> <a href="${params.loginUrl}">${params.loginUrl}</a></p>
      </div>

      <div style="background: #fff; border: 1px solid #E8E0DC; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">Sua sessão</p>
        <p style="margin: 0 0 4px;">📅 ${params.sessionDate} às ${params.sessionTime}</p>
        <p style="margin: 0;">🎥 ${typeLabel}</p>
      </div>

      <p style="color: #8B7B72; font-size: 13px;">
        Você poderá acessar a sala da sessão diretamente pela plataforma no horário agendado.
        Recomendamos alterar sua senha após o primeiro acesso.
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Sua sessão foi agendada — dados de acesso",
    html,
  });
}

async function sendSessionNotificationEmail(params: {
  to: string;
  name: string;
  sessionDate: string;
  sessionTime: string;
  sessionType: string;
  loginUrl: string;
}) {
  const typeLabel = params.sessionType === "video" ? "Videochamada" : "Chat";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #2C2420;">
      <h2 style="color: #1A1614;">Nova sessão agendada, ${params.name}!</h2>
      <p>Uma nova sessão foi agendada para você:</p>

      <div style="background: #fff; border: 1px solid #E8E0DC; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 4px;">📅 ${params.sessionDate} às ${params.sessionTime}</p>
        <p style="margin: 0;">🎥 ${typeLabel}</p>
      </div>

      <p>
        <a href="${params.loginUrl}" style="background: #1A1614; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Acessar plataforma
        </a>
      </p>

      <p style="color: #8B7B72; font-size: 13px;">
        Acesse no horário agendado para entrar na sala da sessão.
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Nova sessão agendada",
    html,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Autenticação
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

    const { data: profProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profProfile?.role !== "profissional") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const nome = String(body.nome ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim() || null;
    const date = String(body.date ?? "").trim();   // YYYY-MM-DD
    const time = String(body.time ?? "").trim();   // HH:mm
    const duration = parseInt(body.duration ?? "50", 10);
    const type = body.type === "chat" ? "chat" : "video";

    // Validações
    if (!nome || nome.length < 2) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }
    if (!date || !time) {
      return NextResponse.json({ error: "Data e hora são obrigatórios" }, { status: 400 });
    }
    if (isNaN(duration) || duration < 10 || duration > 480) {
      return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
    }

    // Monta start_at e end_at
    const start_at = new Date(`${date}T${time}:00`);
    if (isNaN(start_at.getTime())) {
      return NextResponse.json({ error: "Data/hora inválida" }, { status: 400 });
    }
    const end_at = new Date(start_at.getTime() + duration * 60 * 1000);

    // Verifica se paciente já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUser?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    let patientId: string;
    let isNewPatient = false;
    let tempPassword: string | null = null;

    if (existingAuthUser) {
      patientId = existingAuthUser.id;
    } else {
      // Cria novo paciente
      isNewPatient = true;
      tempPassword = generatePassword();

      const { data: created, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { nome },
        });

      if (createError || !created.user) {
        return NextResponse.json(
          { error: createError?.message || "Erro ao criar paciente" },
          { status: 500 },
        );
      }

      patientId = created.user.id;

      await supabaseAdmin.from("profiles").upsert(
        {
          id: patientId,
          nome,
          role: "cliente",
          email,
          phone,
          status: "active",
          tier: "standard",
        },
        { onConflict: "id" },
      );
    }

    // Cria o agendamento
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from("appointments")
      .insert({
        user_id: patientId,
        profissional_id: user.id,
        appointment_type: type,
        status: "scheduled",
        start_at: start_at.toISOString(),
        end_at: end_at.toISOString(),
      })
      .select("id")
      .single();

    if (apptError || !appointment) {
      return NextResponse.json(
        { error: apptError?.message || "Erro ao criar sessão" },
        { status: 500 },
      );
    }

    // Envia e-mail ao paciente
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      new URL(request.url).origin;

    const loginUrl = `${origin}/login`;
    const sessionDate = start_at.toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const sessionTime = start_at.toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit",
    });

    try {
      if (isNewPatient && tempPassword) {
        await sendAccessEmail({
          to: email, name: nome, password: tempPassword,
          sessionDate, sessionTime, sessionType: type, loginUrl,
        });
      } else {
        await sendSessionNotificationEmail({
          to: email, name: nome,
          sessionDate, sessionTime, sessionType: type, loginUrl,
        });
      }
    } catch {
      // E-mail falhou, mas sessão foi criada — não quebra o fluxo
    }

    return NextResponse.json({
      ok: true,
      appointmentId: appointment.id,
      isNewPatient,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
