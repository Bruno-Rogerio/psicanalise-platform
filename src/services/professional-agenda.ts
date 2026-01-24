// src/services/professional-agenda.ts
import { supabase } from "@/lib/supabase-browser";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type AppointmentType = "video" | "chat";

export type ProfessionalAppointment = {
  id: string;
  user_id: string;
  profissional_id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  patient_name?: string | null;
};

// Supabase pode devolver join como objeto OU array (dependendo do relacionamento)
type JoinMaybeArray<T> = T | T[] | null;

type AppointmentRowFromDB = {
  id: string;
  user_id: string;
  profissional_id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  user: JoinMaybeArray<{ nome: string | null }>;
};

function pickJoinOne<T>(value: JoinMaybeArray<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function getLoggedProfessionalId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const id = data.user?.id;
  if (!id) throw new Error("Você precisa estar logado.");
  return id;
}

export async function listProfessionalAppointmentsForRange(
  profissionalId: string,
  from: Date,
  to: Date,
): Promise<ProfessionalAppointment[]> {
  const fromISO = startOfDay(from).toISOString();
  const toISO = endOfDay(to).toISOString();

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
      user:profiles!appointments_user_id_fkey(nome)
    `,
    )
    .eq("profissional_id", profissionalId)
    .gte("start_at", fromISO)
    .lte("start_at", toISO)
    .order("start_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as unknown as AppointmentRowFromDB[];

  return rows.map((r) => {
    const u = pickJoinOne(r.user);
    return {
      id: r.id,
      user_id: r.user_id,
      profissional_id: r.profissional_id,
      appointment_type: r.appointment_type,
      status: r.status,
      start_at: r.start_at,
      end_at: r.end_at,
      patient_name: u?.nome ?? null,
    };
  });
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

export function getMonthRange(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // margem pro calendário ficar “vivo”
  const from = addDays(first, -7);
  const to = addDays(last, 7);

  return { from, to };
}
