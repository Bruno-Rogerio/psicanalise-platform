// src/app/api/daily/ensure-room/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const DAILY_API_KEY = process.env.DAILY_API_KEY!;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN!; // ex: "seusubdominio.daily.co"

function supabaseServer() {
  const cookieStorePromise = cookies(); // <- async no Next 15/16

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const store = await cookieStorePromise;
          return store.getAll();
        },
        async setAll(cookiesToSet) {
          const store = await cookieStorePromise;
          for (const c of cookiesToSet) {
            store.set(c.name, c.value, c.options);
          }
        },
      },
    },
  );
}

type Body = {
  appointmentId: string;
};

export async function POST(req: Request) {
  try {
    if (!DAILY_API_KEY || !DAILY_DOMAIN) {
      return NextResponse.json(
        { error: "Missing DAILY env vars" },
        { status: 500 },
      );
    }

    const { appointmentId } = (await req.json()) as Body;
    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId required" },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();

    // precisa estar logado
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // pega a sessão e valida permissão (cliente ou profissional)
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select(
        "id, user_id, profissional_id, appointment_type, status, start_at, end_at, daily_room_name",
      )
      .eq("id", appointmentId)
      .single();

    if (apptErr || !appt) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    const isAllowed =
      user.id === appt.user_id || user.id === appt.profissional_id;

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // se já existe sala salva no banco, só retorna
    if (appt.daily_room_name) {
      return NextResponse.json({
        roomName: appt.daily_room_name,
        roomUrl: `https://${DAILY_DOMAIN}/${appt.daily_room_name}`,
      });
    }

    // cria sala no Daily
    const roomName = `sess-${appointmentId.replace(/-/g, "").slice(0, 20)}`;

    const createResp = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          enable_chat: false, // chat do Daily off (vocês já tem chat próprio)
          enable_screenshare: true,
          enable_recording: "none",
          start_audio_off: false,
          start_video_off: false,
        },
      }),
    });

    const createJson = await createResp.json();

    if (!createResp.ok) {
      return NextResponse.json(
        { error: "Daily create room failed", details: createJson },
        { status: 500 },
      );
    }

    // salva no banco para reuso
    const { error: updErr } = await supabase
      .from("appointments")
      .update({ daily_room_name: roomName })
      .eq("id", appointmentId);

    if (updErr) {
      // se falhar salvar, ainda devolve a sala (mas ideal é salvar)
      return NextResponse.json(
        {
          roomName,
          roomUrl: createJson?.url ?? `https://${DAILY_DOMAIN}/${roomName}`,
          warning: "Room created but not saved to DB",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      roomName,
      roomUrl: createJson?.url ?? `https://${DAILY_DOMAIN}/${roomName}`,
    });
  } catch (e: any) {
    console.error("ensure-room error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
