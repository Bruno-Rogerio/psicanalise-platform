"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { isNowWithinSession, fmtDate, fmtTime } from "@/services/session-room";

type AppointmentType = "video" | "chat";
type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

type JoinMaybeArray<T> = T | T[] | null;

type RowFromDB = {
  id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  profissional: JoinMaybeArray<{ nome: string | null }>;
};

type Row = {
  id: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  profissional_nome: string | null;
};

function pickJoinOne<T>(value: JoinMaybeArray<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function MinhasSessoesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            profissional:profiles!appointments_profissional_id_fkey(nome)
          `,
          )
          .eq("user_id", userId)
          .order("start_at", { ascending: false });

        if (error) throw error;

        const db = (data ?? []) as unknown as RowFromDB[];
        const parsed: Row[] = db.map((r) => {
          const p = pickJoinOne(r.profissional);
          return {
            id: r.id,
            appointment_type: r.appointment_type,
            status: r.status,
            start_at: r.start_at,
            end_at: r.end_at,
            profissional_nome: p?.nome ?? null,
          };
        });

        setRows(parsed);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message ?? "Erro ao carregar sessões.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = useMemo(() => new Date(), []);
  const upcoming = useMemo(
    () =>
      rows
        .filter((r) => new Date(r.end_at) >= now && r.status !== "cancelled")
        .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at)),
    [rows, now],
  );

  const past = useMemo(
    () =>
      rows
        .filter((r) => new Date(r.end_at) < now || r.status === "completed")
        .sort((a, b) => +new Date(b.start_at) - +new Date(a.start_at)),
    [rows, now],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
          Minhas sessões
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5F6B64] sm:text-base">
          Você consegue entrar na sessão apenas dentro do horário agendado.
        </p>
      </header>

      {errorMsg ? (
        <div className="rounded-2xl border border-[#D6DED9] bg-white/60 p-4 text-sm text-[#5F6B64]">
          {errorMsg}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold text-[#111111]">Próximas</h2>
          <span className="text-xs text-[#5F6B64]">
            {loading ? "Carregando…" : `${upcoming.length} sessão(ões)`}
          </span>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <SkeletonList />
          ) : upcoming.length === 0 ? (
            <Empty text="Sem sessões futuras por enquanto." />
          ) : (
            upcoming.map((s) => <SessionRow key={s.id} row={s} />)
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold text-[#111111]">Histórico</h2>
          <span className="text-xs text-[#5F6B64]">{past.length}</span>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <SkeletonList />
          ) : past.length === 0 ? (
            <Empty text="Sem histórico ainda." />
          ) : (
            past.map((s) => <SessionRow key={s.id} row={s} />)
          )}
        </div>
      </section>
    </div>
  );
}

function SessionRow({ row }: { row: Row }) {
  const start = new Date(row.start_at);
  const end = new Date(row.end_at);

  const canEnter =
    row.status !== "cancelled" && isNowWithinSession(row.start_at, row.end_at);

  const enterHref = `/sessoes/${row.id}`; // sua rota real do cliente (já existe)

  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#111111]">
              {fmtTime(start)}–{fmtTime(end)}
            </p>
            <Pill>{row.appointment_type === "video" ? "Vídeo" : "Chat"}</Pill>
            <PillMuted>{statusLabel(row.status)}</PillMuted>
          </div>

          <p className="mt-2 text-sm text-[#111111] truncate">
            Profissional:{" "}
            <span className="font-medium">
              {row.profissional_nome ?? "Psicanalista"}
            </span>
          </p>
          <p className="mt-1 text-xs text-[#5F6B64]">
            {fmtDate(start)} • Sessão #{row.id.slice(0, 8)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {canEnter ? (
            <Link
              href={enterHref}
              className="rounded-xl bg-[#111111] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 text-center"
            >
              Entrar agora
            </Link>
          ) : (
            <button
              disabled
              className="rounded-xl bg-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500 text-center"
              title="Você só consegue entrar durante o horário da sessão."
            >
              Fora do horário
            </button>
          )}

          {/* “Ver detalhes” pode continuar existindo mas sem abrir a sala.
              Se quiser remover, apaga este Link. */}
          <Link
            href={enterHref}
            className="rounded-xl border border-[#D6DED9] bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-white/80 text-center"
          >
            Ver informações
          </Link>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
      {children}
    </span>
  );
}

function PillMuted({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#D6DED9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5F6B64]">
      {children}
    </span>
  );
}

function statusLabel(s: AppointmentStatus) {
  switch (s) {
    case "scheduled":
      return "Agendada";
    case "completed":
      return "Realizada";
    case "cancelled":
      return "Cancelada";
    case "rescheduled":
      return "Reagendada";
    default:
      return s;
  }
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#D6DED9] bg-white/70 p-4 text-sm text-[#5F6B64]">
      {text}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[92px] animate-pulse rounded-2xl border border-[#D6DED9] bg-white/70"
        />
      ))}
    </div>
  );
}
