import { supabase } from "@/lib/supabase-browser";

export type AppointmentType = "video" | "chat";
export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type SessionRoom = {
  id: string;
  user_id: string;
  profissional_id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  created_at: string;

  patient: { id: string; nome: string | null } | null;
  professional: { id: string; nome: string | null } | null;
};

export async function getSessionRoomById(
  appointmentId: string,
): Promise<SessionRoom> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
        id, user_id, profissional_id, appointment_type, status, start_at, end_at, created_at,
        patient:profiles!appointments_user_id_fkey ( id, nome ),
        professional:profiles!appointments_profissional_id_fkey ( id, nome )
      `,
    )
    .eq("id", appointmentId)
    .single();

  if (error) throw error;
  return data as unknown as SessionRoom;
}

export function isNowWithinSession(startISO: string, endISO: string) {
  const now = Date.now();
  const start = +new Date(startISO);
  const end = +new Date(endISO);
  return now >= start && now <= end;
}

export function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
