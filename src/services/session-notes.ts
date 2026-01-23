import { supabase } from "@/lib/supabase-browser";

export type SessionNotes = {
  appointment_id: string;
  profissional_id: string;
  user_id: string;

  queixa: string | null;
  associacoes: string | null;
  intervencoes: string | null;
  plano: string | null;
  observacoes: string | null;

  created_at: string;
  updated_at: string;
};

export async function getNotes(
  appointmentId: string,
): Promise<SessionNotes | null> {
  const { data, error } = await supabase
    .from("session_notes")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (error) throw error;
  return (data as SessionNotes) ?? null;
}

export async function upsertNotes(
  payload: Partial<SessionNotes> & {
    appointment_id: string;
    profissional_id: string;
    user_id: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("session_notes")
    .upsert(payload, { onConflict: "appointment_id" });

  if (error) throw error;
}
