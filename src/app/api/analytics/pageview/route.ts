import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { page_path, referrer, session_id } = await req.json();
    await supabaseAdmin.from("analytics_pageviews").insert({
      page_path: page_path || "/",
      referrer: referrer || null,
      session_id: session_id || null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
