import { supabase } from "@/lib/supabase-browser";

export type AppointmentType = "video" | "chat";
export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

// Supabase pode devolver join como objeto OU array (depende do select/join)
type JoinMaybeArray<T> = T | T[] | null;

function pickJoinOne<T>(value: JoinMaybeArray<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

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

type SessionRoomRowFromDB = {
  id: string;
  user_id: string;
  profissional_id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  created_at: string;

  patient: JoinMaybeArray<{ id: string; nome: string | null }>;
  professional: JoinMaybeArray<{ id: string; nome: string | null }>;
};

export async function getSessionRoomById(
  appointmentId: string,
): Promise<SessionRoom> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
        id,
        user_id,
        profissional_id,
        appointment_type,
        status,
        start_at,
        end_at,
        created_at,
        patient:profiles!appointments_user_id_fkey ( id, nome ),
        professional:profiles!appointments_profissional_id_fkey ( id, nome )
      `,
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Sessão não encontrada.");

  const row = data as unknown as SessionRoomRowFromDB;

  return {
    id: row.id,
    user_id: row.user_id,
    profissional_id: row.profissional_id,
    appointment_type: row.appointment_type,
    status: row.status,
    start_at: row.start_at,
    end_at: row.end_at,
    created_at: row.created_at,
    patient: pickJoinOne(row.patient),
    professional: pickJoinOne(row.professional),
  };
}

export function isNowWithinSession(startISO: string, endISO: string) {
  const now = Date.now();
  const start = +new Date(startISO);
  const end = +new Date(endISO);
  return now >= start && now <= end;
}

// Libera X minutos antes do início (ex: 10 min), e bloqueia após o fim.
export function isNowWithinSessionWithMargin(
  startISO: string,
  endISO: string,
  minutesBefore = 10,
) {
  const now = Date.now();
  const start = +new Date(startISO) - minutesBefore * 60 * 1000;
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
