import { supabase } from "@/lib/supabase-browser";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";
export type AppointmentType = "video" | "chat";

export type SessionDetails = {
  id: string;
  user_id: string;
  profissional_id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  patient_name: string | null;
};

export type SessionNote = {
  id: string;
  appointment_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function getSessionDetails(
  appointmentId: string,
): Promise<SessionDetails> {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!auth.user?.id) throw new Error("Você precisa estar logado.");

  const { data: appt, error } = await supabase
    .from("appointments")
    .select(
      "id, user_id, profissional_id, appointment_type, status, start_at, end_at",
    )
    .eq("id", appointmentId)
    .single();

  if (error) throw error;

  if (appt.profissional_id !== auth.user.id) {
    throw new Error("Sem permissão para acessar esta sessão.");
  }

  const { data: patient, error: pErr } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("id", appt.user_id)
    .maybeSingle();

  if (pErr) throw pErr;

  return {
    ...(appt as any),
    patient_name: patient?.nome ?? null,
  };
}

export async function getOrCreateSessionNote(
  appointmentId: string,
): Promise<SessionNote> {
  const { data, error } = await supabase
    .from("session_notes")
    .select("id, appointment_id, notes, created_at, updated_at")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as SessionNote;

  const { data: created, error: cErr } = await supabase
    .from("session_notes")
    .insert({ appointment_id: appointmentId, notes: "" })
    .select("id, appointment_id, notes, created_at, updated_at")
    .single();

  if (cErr) throw cErr;
  return created as SessionNote;
}

export async function saveSessionNote(
  appointmentId: string,
  notes: string,
): Promise<void> {
  const { error } = await supabase
    .from("session_notes")
    .update({ notes })
    .eq("appointment_id", appointmentId);

  if (error) throw error;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);
  if (error) throw error;
}

export function fmtDateTime(d: Date) {
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export async function rescheduleAppointment(
  appointmentId: string,
  newStartISO: string,
  newEndISO: string,
) {
  const { error } = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: appointmentId,
    p_new_start: newStartISO,
    p_new_end: newEndISO,
  });

  if (error) throw error;
}
