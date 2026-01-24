// src/app/api/daily/ensure-room/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const DAILY_API_KEY = process.env.DAILY_API_KEY!;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN!; // ex: "seusubdominio.daily.co"

function supabaseServer() {
  const cookieStorePromise = cookies();

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
          for (const c of cookiesToSet) store.set(c.name, c.value, c.options);
        },
      },
    },
  );
}

type Body = { appointmentId: string };

function buildDailyUrl(roomName: string) {
  const domain = String(DAILY_DOMAIN || "")
    .replace(/^https?:\/\//, "")
    .trim();
  return `https://${domain}/${roomName}`;
}

// expira o token alguns minutos depois do fim da sessão
function tokenExpFromEnd(endISO: string, extraMinutes = 20) {
  const end = new Date(endISO).getTime();
  const expMs = end + extraMinutes * 60 * 1000;
  return Math.floor(expMs / 1000); // unix seconds
}

async function createMeetingToken(args: {
  roomName: string;
  isOwner: boolean;
  userName?: string;
  exp?: number;
}) {
  const resp = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: args.roomName,
        is_owner: args.isOwner,
        user_name: args.userName ?? undefined,
        exp: args.exp,
      },
    }),
  });

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(
      `Daily meeting token failed: ${json?.error ?? "unknown error"}`,
    );
  }
  return json?.token as string;
}

export async function POST(req: Request) {
  try {
    if (!DAILY_API_KEY || !DAILY_DOMAIN) {
      return NextResponse.json(
        { error: "Missing DAILY_API_KEY or DAILY_DOMAIN" },
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

    // carrega appointment + valida permissão
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

    const isOwner = user.id === appt.profissional_id;

    // garante roomName (cria se não existir)
    let roomName = appt.daily_room_name as string | null;
    if (!roomName) {
      roomName = `sess-${appointmentId.replace(/-/g, "").slice(0, 20)}`;

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
            enable_chat: false,
            enable_screenshare: true,
            // ✅ sem gravação: não setar enable_recording
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

      // salva no banco
      const { error: updErr } = await supabase
        .from("appointments")
        .update({ daily_room_name: roomName })
        .eq("id", appointmentId);

      if (updErr) {
        // segue mesmo assim, mas avisa
        console.warn("Room created but not saved:", updErr.message);
      }
    }

    const url = buildDailyUrl(roomName);

    // ✅ cria meeting token pro join em sala private
    const exp = tokenExpFromEnd(appt.end_at, 20);
    const token = await createMeetingToken({
      roomName,
      isOwner,
      userName: isOwner ? "Profissional" : "Paciente",
      exp,
    });

    return NextResponse.json({
      roomName,
      url,
      token,
    });
  } catch (e: any) {
    console.error("ensure-room error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
