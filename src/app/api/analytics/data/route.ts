import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  // Verifica autenticação e role
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "profissional") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Período
  const period = req.nextUrl.searchParams.get("period") || "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const from = subDays(new Date(), days).toISOString();

  const [pvRes, evRes] = await Promise.all([
    supabaseAdmin
      .from("analytics_pageviews")
      .select("created_at, page_path")
      .gte("created_at", from)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("analytics_events")
      .select("created_at, event_name, event_category, event_label, page_path")
      .gte("created_at", from)
      .order("created_at", { ascending: true }),
  ]);

  return NextResponse.json({
    pageviews: pvRes.data || [],
    events: evRes.data || [],
  });
}
