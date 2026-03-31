import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { event_name, event_category, event_label, event_value, page_path, session_id } =
      await req.json();

    await supabaseAdmin.from("analytics_events").insert({
      event_name,
      event_category: event_category || null,
      event_label: event_label || null,
      event_value: event_value || null,
      page_path: page_path || "/",
      session_id: session_id || null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
