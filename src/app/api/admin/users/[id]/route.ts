import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

async function requireProfessional() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role,status,deleted_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[admin-users] profile fetch failed", profileError);
    return {
      error: NextResponse.json(
        { error: profileError.message || "Erro ao carregar perfil" },
        { status: 500 },
      ),
    };
  }

  if (
    !profile ||
    profile.role !== "profissional" ||
    profile.status === "blocked" ||
    profile.deleted_at
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireProfessional();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));

    const updates: Record<string, any> = {};

    if (body.nome !== undefined) {
      const nome = String(body.nome ?? "").trim();
      if (nome.length < 2) {
        return NextResponse.json({ error: "Nome invalido" }, { status: 400 });
      }
      updates.nome = nome;
    }

    if (body.phone !== undefined) {
      const phone = String(body.phone ?? "").trim();
      updates.phone = phone || null;
    }

    if (body.status !== undefined) {
      const status = String(body.status);
      if (!["active", "blocked", "pending_email"].includes(status)) {
        return NextResponse.json({ error: "Status invalido" }, { status: 400 });
      }
      updates.status = status;
    }

    if (body.email !== undefined) {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Email invalido" }, { status: 400 });
      }
      updates.email = email;

      const { error: emailErr } = await supabaseAdmin.auth.admin.updateUserById(
        params.id,
        { email },
      );

      if (emailErr) {
        return NextResponse.json({ error: emailErr.message }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", params.id);

    if (error) {
      console.error("[admin-users] update failed", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin-users] PATCH error", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireProfessional();
    if (auth.error) return auth.error;

    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ deleted_at: now, status: "blocked" })
      .eq("id", params.id);

    if (error) {
      console.error("[admin-users] delete failed", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin-users] DELETE error", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno" },
      { status: 500 },
    );
  }
}
