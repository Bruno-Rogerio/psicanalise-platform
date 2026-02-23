import { supabase } from "@/lib/supabase-browser";

export type AppointmentType = "chat" | "video";

export type Professional = {
  id: string;
  nome: string | null;
};

export type ProfessionalSettings = {
  profissional_id: string;
  timezone: string;
  session_duration_video_min: number;
  session_duration_chat_min: number;
  min_cancel_hours: number;
};

export type AvailabilityRule = {
  id: string;
  profissional_id: string;
  weekday: number; // 0-6 (0=domingo)
  start_time: string; // "09:00:00" ou "09:00"
  end_time: string;
  appointment_type: AppointmentType;
  is_active: boolean;
};

export type AvailabilityBlock = {
  id: string;
  profissional_id: string;
  start_at: string; // ISO
  end_at: string; // ISO
};

export type Appointment = {
  id: string;
  profissional_id: string;
  start_at: string; // ISO
  end_at: string; // ISO
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  appointment_type: AppointmentType;
};

export type Product = {
  id: string;
  profissional_id: string;
  title: string;
  description: string | null;
  appointment_type: AppointmentType;
  sessions_count: number;
  price_cents: number;
  is_active: boolean;
};

export type Slot = {
  start: Date;
  end: Date;
  appointment_type: AppointmentType;
};

export type SlotStatus = "available" | "blocked" | "booked" | "past";

export type SlotWithStatus = Slot & {
  status: SlotStatus;
};

export async function getProfessional(): Promise<Professional> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,nome")
    .eq("role", "profissional")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);

  const prof = data?.[0];
  if (!prof) throw new Error("Profissional não encontrado.");

  return prof;
}

export async function getSettings(
  professionalId: string,
): Promise<ProfessionalSettings> {
  const { data, error } = await supabase
    .from("professional_settings")
    .select(
      "profissional_id,timezone,session_duration_video_min,session_duration_chat_min,min_cancel_hours",
    )
    .eq("profissional_id", professionalId)
    .single();

  if (error || !data)
    throw new Error(error?.message || "Settings não encontrados");
  return data;
}

export async function getRules(
  professionalId: string,
): Promise<AvailabilityRule[]> {
  const { data, error } = await supabase
    .from("availability_rules")
    .select(
      "id,profissional_id,weekday,start_time,end_time,appointment_type,is_active",
    )
    .eq("profissional_id", professionalId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBlocks(
  professionalId: string,
  fromISO: string,
  toISO: string,
): Promise<AvailabilityBlock[]> {
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("id,profissional_id,start_at,end_at")
    .eq("profissional_id", professionalId)
    .gte("end_at", fromISO)
    .lte("start_at", toISO);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBookedAppointments(
  professionalId: string,
  fromISO: string,
  toISO: string,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id,profissional_id,start_at,end_at,status,appointment_type")
    .eq("profissional_id", professionalId)
    .in("status", ["scheduled", "rescheduled"])
    // ✅ pega tudo que sobrepõe [fromISO, toISO]
    .gte("end_at", fromISO)
    .lte("start_at", toISO);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getProducts(
  professionalId: string,
  type: AppointmentType,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,profissional_id,title,description,appointment_type,sessions_count,price_cents,is_active",
    )
    .eq("profissional_id", professionalId)
    .eq("appointment_type", type)
    .eq("is_active", true)
    .order("sessions_count", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

function parseTimeToHM(time: string): { h: number; m: number } {
  const [hh, mm] = time.split(":");
  return { h: Number(hh), m: Number(mm) };
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

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function generateSlotsForDay(params: {
  day: Date;
  type: AppointmentType;
  rules: AvailabilityRule[];
  settings: ProfessionalSettings;
  blocks: AvailabilityBlock[];
  booked: Appointment[];
}): Slot[] {
  const { day, type, rules, settings, blocks, booked } = params;

  const weekday = day.getDay(); // 0-6
  const durationMin =
    type === "video"
      ? settings.session_duration_video_min
      : settings.session_duration_chat_min;

  const dayRules = rules.filter(
    (r) => r.weekday === weekday && r.appointment_type === type && r.is_active,
  );

  if (!dayRules.length) return [];

  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  const blockKeys = new Set(
    blocks
      .map((b) => ({ start: new Date(b.start_at), end: new Date(b.end_at) }))
      .filter((b) => overlaps(b.start, b.end, dayStart, dayEnd))
      .map((b) => `${b.start.toISOString()}|${b.end.toISOString()}`),
  );

  const bookedRanges = booked
    .map((a) => ({ start: new Date(a.start_at), end: new Date(a.end_at) }))
    .filter((b) => overlaps(b.start, b.end, dayStart, dayEnd));

  const slots: Slot[] = [];

  for (const r of dayRules) {
    const { h: sh, m: sm } = parseTimeToHM(r.start_time);
    const { h: eh, m: em } = parseTimeToHM(r.end_time);

    const windowStart = new Date(day);
    windowStart.setHours(sh, sm, 0, 0);

    const windowEnd = new Date(day);
    windowEnd.setHours(eh, em, 0, 0);

    // step: 10min para sensação de “agenda moderna”
    const stepMin = 10;

    for (
      let cursor = new Date(windowStart);
      cursor < windowEnd;
      cursor = new Date(cursor.getTime() + stepMin * 60000)
    ) {
      const slotStart = cursor;
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

      if (slotEnd > windowEnd) continue;

      const isBlocked = blockKeys.has(
        `${slotStart.toISOString()}|${slotEnd.toISOString()}`,
      );
      if (isBlocked) continue;

      const isBooked = bookedRanges.some((b) =>
        overlaps(slotStart, slotEnd, b.start, b.end),
      );
      if (isBooked) continue;

      // não permitir slots no passado
      if (slotStart.getTime() < Date.now()) continue;

      slots.push({ start: slotStart, end: slotEnd, appointment_type: type });
    }
  }

  // remove duplicados quando existir regra repetida
  const unique = new Map<string, Slot>();
  for (const s of slots) unique.set(s.start.toISOString(), s);
  return Array.from(unique.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}

export function generateSlotsForDayWithStatus(params: {
  day: Date;
  type: AppointmentType;
  rules: AvailabilityRule[];
  settings: ProfessionalSettings;
  blocks: AvailabilityBlock[];
  booked: Appointment[];
}): SlotWithStatus[] {
  const { day, type, rules, settings, blocks, booked } = params;

  const weekday = day.getDay(); // 0-6
  const durationMin =
    type === "video"
      ? settings.session_duration_video_min
      : settings.session_duration_chat_min;

  const dayRules = rules.filter(
    (r) => r.weekday === weekday && r.appointment_type === type && r.is_active,
  );

  if (!dayRules.length) return [];

  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  const blockKeys = new Set(
    blocks
      .map((b) => ({ start: new Date(b.start_at), end: new Date(b.end_at) }))
      .filter((b) => overlaps(b.start, b.end, dayStart, dayEnd))
      .map((b) => `${b.start.toISOString()}|${b.end.toISOString()}`),
  );

  const bookedRanges = booked
    .map((a) => ({ start: new Date(a.start_at), end: new Date(a.end_at) }))
    .filter((b) => overlaps(b.start, b.end, dayStart, dayEnd));

  const slots: SlotWithStatus[] = [];

  for (const r of dayRules) {
    const { h: sh, m: sm } = parseTimeToHM(r.start_time);
    const { h: eh, m: em } = parseTimeToHM(r.end_time);

    const windowStart = new Date(day);
    windowStart.setHours(sh, sm, 0, 0);

    const windowEnd = new Date(day);
    windowEnd.setHours(eh, em, 0, 0);

    const stepMin = 10;

    for (
      let cursor = new Date(windowStart);
      cursor < windowEnd;
      cursor = new Date(cursor.getTime() + stepMin * 60000)
    ) {
      const slotStart = cursor;
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

      if (slotEnd > windowEnd) continue;

      const isBooked = bookedRanges.some((b) =>
        overlaps(slotStart, slotEnd, b.start, b.end),
      );

      const isPast = slotStart.getTime() < Date.now();

      const isBlocked = blockKeys.has(
        `${slotStart.toISOString()}|${slotEnd.toISOString()}`,
      );

      let status: SlotStatus = "available";
      if (isBooked) status = "booked";
      else if (isPast) status = "past";
      else if (isBlocked) status = "blocked";

      slots.push({ start: slotStart, end: slotEnd, appointment_type: type, status });
    }
  }

  const unique = new Map<string, SlotWithStatus>();
  for (const s of slots) unique.set(s.start.toISOString(), s);

  return Array.from(unique.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}

export async function getCreditsBalance(
  profissionalId: string,
  type: "video" | "chat",
) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { total: 0, used: 0, available: 0 };

  const { data, error } = await supabase
    .from("session_credits")
    .select("total, used")
    .eq("user_id", userId)
    .eq("profissional_id", profissionalId)
    .eq("appointment_type", type)
    .single();

  if (error) {
    // se não existir linha, saldo = 0
    return { total: 0, used: 0, available: 0 };
  }

  const total = data?.total ?? 0;
  const used = data?.used ?? 0;
  const available = Math.max(0, total - used);

  return { total, used, available };
}
