"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";
type AppointmentType = "video" | "chat";

type JoinMaybeArray<T> = T | T[] | null;

type RowFromDB = {
  id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  prof: JoinMaybeArray<{ nome: string | null }>;
};

type Row = {
  id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  prof: { nome: string | null } | null;
};

function pickJoinOne<T>(value: JoinMaybeArray<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function ClienteSessoesPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const userId = auth.user?.id;
        if (!userId) throw new Error("Você precisa estar logado.");

        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_type,
            status,
            start_at,
            end_at,
            prof:profiles!appointments_profissional_id_fkey(nome)
          `,
          )
          .eq("user_id", userId)
          .order("start_at", { ascending: false });

        if (error) throw error;

        const fromDb = (data ?? []) as RowFromDB[];
        const normalized: Row[] = fromDb.map((r) => ({
          id: r.id,
          appointment_type: r.appointment_type,
          status: r.status,
          start_at: r.start_at,
          end_at: r.end_at,
          prof: pickJoinOne(r.prof),
        }));

        setRows(normalized);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message ?? "Erro ao carregar sessões.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcoming = useMemo(
    () => rows.filter((r) => new Date(r.end_at) >= new Date()).slice(0, 20),
    [rows],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
          Minhas sessões
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5F6B64] sm:text-base">
          Acesse suas sessões agendadas e o histórico.
        </p>
      </header>

      {errorMsg ? (
        <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 text-sm text-[#5F6B64]">
          {errorMsg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 backdrop-blur">
        <p className="text-sm font-semibold text-[#111111]">Próximas</p>

        <div className="mt-4 grid gap-3">
          {loading ? (
            <SkeletonList />
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-4 text-sm text-[#5F6B64]">
              Nenhuma sessão agendada.
            </div>
          ) : (
            upcoming.map((s) => (
              <Link
                key={s.id}
                href={`/sessoes/${s.id}`}
                className="block rounded-2xl border border-[#D6DED9] bg-white/70 p-4 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111111]">
                      {fmtDateTimeRange(s.start_at, s.end_at)}
                    </p>
                    <p className="mt-1 text-xs text-[#5F6B64]">
                      Profissional:{" "}
                      <span className="font-medium">
                        {s.prof?.nome ?? "Profissional"}
                      </span>
                      {" • "}
                      Tipo:{" "}
                      <span className="font-medium">
                        {s.appointment_type === "video" ? "Vídeo" : "Chat"}
                      </span>
                      {" • "}
                      Status: <span className="font-medium">{s.status}</span>
                    </p>
                  </div>

                  <span className="rounded-xl bg-[#111111] px-3 py-2 text-xs font-semibold text-white">
                    Abrir
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[86px] animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70"
        />
      ))}
    </div>
  );
}

function fmtDateTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const d = start.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const s = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const e = end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${d} • ${s}–${e}`;
}
