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

type NextSession = {
  id: string;
  start_at: string;
  end_at: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  profissional_nome: string | null;
};

type RecentRow = {
  id: string;
  start_at: string;
  end_at: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
};

type JoinMaybeArray<T> = T | T[] | null;

function pickJoinOne<T>(value: JoinMaybeArray<T>): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function DashboardClientePage() {
  const [loading, setLoading] = useState(true);
  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [recent, setRecent] = useState<RecentRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const userId = auth.user?.id;
        if (!userId) return;

        const nowISO = new Date().toISOString();

        // Próxima sessão (future)
        const { data: nextData, error: nextErr } = await supabase
          .from("appointments")
          .select(
            `
            id,
            start_at,
            end_at,
            appointment_type,
            status,
            profissional:profiles!appointments_profissional_id_fkey(nome)
          `,
          )
          .eq("user_id", userId)
          .neq("status", "cancelled")
          .gte("end_at", nowISO)
          .order("start_at", { ascending: true })
          .limit(1);

        if (nextErr) throw nextErr;

        if (nextData && nextData.length > 0) {
          const row = nextData[0] as any;
          const prof = pickJoinOne(row.profissional);
          setNextSession({
            id: row.id,
            start_at: row.start_at,
            end_at: row.end_at,
            appointment_type: row.appointment_type,
            status: row.status,
            profissional_nome: prof?.nome ?? null,
          });
        } else {
          setNextSession(null);
        }

        // Histórico recente (3 últimas)
        const { data: recentData, error: recentErr } = await supabase
          .from("appointments")
          .select("id,start_at,end_at,appointment_type,status")
          .eq("user_id", userId)
          .order("start_at", { ascending: false })
          .limit(3);

        if (recentErr) throw recentErr;
        setRecent((recentData ?? []) as any);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canEnter = useMemo(() => {
    if (!nextSession) return false;
    if (nextSession.status === "cancelled") return false;
    return isNowWithinSession(nextSession.start_at, nextSession.end_at);
  }, [nextSession]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Bem-vindo(a).
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#6F6F6F] sm:text-base">
          Aqui você agenda suas sessões, acompanha a próxima consulta e encontra
          seu histórico. Tudo com clareza, no seu tempo.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Agendamento
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Agendar nova sessão
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
            Escolha um horário exato, tipo de atendimento (chat/vídeo) e
            finalize.
          </p>
          <Link
            href="/agenda"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-[#111111] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Ver horários disponíveis
          </Link>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Próxima sessão
          </p>

          {loading ? (
            <div className="mt-3 h-24 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50" />
          ) : nextSession ? (
            <>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {nextSession.appointment_type === "video" ? "Vídeo" : "Chat"} •{" "}
                {fmtTime(new Date(nextSession.start_at))}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
                {fmtDate(new Date(nextSession.start_at))}{" "}
                {nextSession.profissional_nome
                  ? `• com ${nextSession.profissional_nome}`
                  : ""}
              </p>

              <div className="mt-5 flex flex-col gap-2">
                {canEnter ? (
                  <Link
                    href={`/sessoes/${nextSession.id}`}
                    className="inline-flex w-full items-center justify-center rounded-md bg-[#111111] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Entrar agora
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex w-full items-center justify-center rounded-md bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500"
                    title="Você só consegue entrar durante o horário da sessão."
                  >
                    Fora do horário
                  </button>
                )}

                <Link
                  href="/minhas-sessoes"
                  className="inline-flex w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-50"
                >
                  Ver detalhes
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Nenhuma sessão marcada
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
                Assim que você agendar, sua próxima sessão aparece aqui com dia,
                horário e acesso.
              </p>
              <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                Dica: você pode cancelar com reembolso até 24h antes.
              </div>
            </>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Organização
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Suas consultas
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
            Histórico por data, tipo de sessão e status (realizada, futura,
            reagendada).
          </p>
          <Link
            href="/minhas-sessoes"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-50"
          >
            Ver histórico
          </Link>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Histórico recente
            </h2>
            <p className="mt-1 text-sm text-[#6F6F6F]">
              Suas últimas sessões aparecem aqui.
            </p>
          </div>
          <Link
            href="/minhas-sessoes"
            className="text-sm text-zinc-700 hover:text-zinc-900"
          >
            Ver tudo →
          </Link>
        </div>

        <div className="rounded-xl border border-[#E5E3DF] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50" />
          ) : recent.length === 0 ? (
            <p className="text-sm text-[#6F6F6F]">
              Ainda não há sessões no seu histórico.
            </p>
          ) : (
            <div className="grid gap-3">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/sessoes/${r.id}`}
                  className="rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">
                        {fmtDate(new Date(r.start_at))} •{" "}
                        {fmtTime(new Date(r.start_at))}
                      </p>
                      <p className="mt-1 text-sm text-[#6F6F6F]">
                        {r.appointment_type === "video" ? "Vídeo" : "Chat"} •{" "}
                        {statusLabel(r.status)}
                      </p>
                    </div>
                    <span className="text-sm text-zinc-700">Abrir →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {children}
    </div>
  );
}

function statusLabel(s: AppointmentStatus) {
  if (s === "scheduled") return "Agendada";
  if (s === "completed") return "Realizada";
  if (s === "cancelled") return "Cancelada";
  if (s === "rescheduled") return "Reagendada";
  return s;
}
