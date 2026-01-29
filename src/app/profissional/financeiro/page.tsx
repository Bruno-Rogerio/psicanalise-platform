// src/app/profissional/financeiro/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-browser";

type Payment = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  patient_name: string;
  appointment_type: string;
};

type Period = "week" | "month" | "year" | "all";

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [period, setPeriod] = useState<Period>("month");

  // Load payments (mock data for now - would come from payments table)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) return;

        // Get completed appointments as "payments"
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_type,
            status,
            start_at,
            patient:profiles!appointments_user_id_fkey ( nome )
          `,
          )
          .eq("profissional_id", auth.user.id)
          .eq("status", "completed")
          .order("start_at", { ascending: false });

        if (!error && data) {
          const mockPayments: Payment[] = data.map((a: any) => ({
            id: a.id,
            amount: a.appointment_type === "video" ? 200 : 150, // Mock prices
            status: "paid",
            created_at: a.start_at,
            patient_name: a.patient?.[0]?.nome || "Paciente",
            appointment_type: a.appointment_type,
          }));
          setPayments(mockPayments);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter by period
  const filteredPayments = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return payments;
    }

    return payments.filter((p) => new Date(p.created_at) >= startDate);
  }, [payments, period]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const count = filteredPayments.length;
    const avg = count > 0 ? total / count : 0;

    // By type
    const videoTotal = filteredPayments
      .filter((p) => p.appointment_type === "video")
      .reduce((sum, p) => sum + p.amount, 0);
    const chatTotal = filteredPayments
      .filter((p) => p.appointment_type === "chat")
      .reduce((sum, p) => sum + p.amount, 0);

    return { total, count, avg, videoTotal, chatTotal };
  }, [filteredPayments]);

  // Monthly chart data (last 6 months)
  const chartData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const monthPayments = payments.filter((p) => {
        const pDate = new Date(p.created_at);
        return pDate >= d && pDate < nextMonth;
      });

      const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      months.push({
        label: d.toLocaleDateString("pt-BR", { month: "short" }),
        value: total,
      });
    }

    return months;
  }, [payments]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <WalletIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900">Financeiro</h1>
            <p className="text-sm text-warm-600">
              Acompanhe seus ganhos e relatórios
            </p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-1">
          {(["week", "month", "year", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                period === p
                  ? "bg-[#4A7C59] text-white shadow"
                  : "text-warm-600 hover:text-warm-900"
              }`}
            >
              {p === "week"
                ? "Semana"
                : p === "month"
                  ? "Mês"
                  : p === "year"
                    ? "Ano"
                    : "Tudo"}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MoneyIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          label="Total Recebido"
          value={formatCurrency(stats.total)}
          sublabel={`${stats.count} sessão(ões)`}
        />
        <StatCard
          icon={<TrendingIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          label="Média por Sessão"
          value={formatCurrency(stats.avg)}
          sublabel="valor médio"
        />
        <StatCard
          icon={<VideoIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-rose-500 to-rose-600"
          label="Videochamadas"
          value={formatCurrency(stats.videoTotal)}
          sublabel="total em vídeo"
        />
        <StatCard
          icon={<ChatIcon className="h-6 w-6" />}
          iconBg="bg-gradient-to-br from-indigo-500 to-indigo-600"
          label="Chat"
          value={formatCurrency(stats.chatTotal)}
          sublabel="total em chat"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-warm-900">Evolução Mensal</h2>
            <p className="text-sm text-warm-500">Últimos 6 meses</p>

            <div className="mt-6">
              <div className="flex h-48 items-end justify-between gap-2">
                {chartData.map((month, i) => (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#4A7C59] to-[#6B9B7A] transition-all hover:opacity-80"
                      style={{
                        height: `${(month.value / maxChartValue) * 100}%`,
                        minHeight: month.value > 0 ? "8px" : "0px",
                      }}
                    />
                    <p className="text-xs font-medium text-warm-500">
                      {month.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="mt-4 flex items-center justify-between border-t border-warm-200 pt-4 text-xs text-warm-500">
                <span>R$ 0</span>
                <span>{formatCurrency(maxChartValue / 2)}</span>
                <span>{formatCurrency(maxChartValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-warm-900">Últimos Recebimentos</h2>
            <p className="text-sm text-warm-500">Sessões realizadas</p>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl bg-warm-100"
                    />
                  ))}
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="rounded-xl bg-warm-50 p-4 text-center text-sm text-warm-500">
                  Nenhum recebimento no período
                </div>
              ) : (
                filteredPayments
                  .slice(0, 5)
                  .map((payment) => (
                    <PaymentRow key={payment.id} payment={payment} />
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full List */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-warm-900">Histórico Completo</h2>
            <p className="text-sm text-warm-500">
              {filteredPayments.length} registro(s)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-warm-100"
              />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="rounded-xl bg-warm-50 p-8 text-center">
            <WalletIcon className="mx-auto h-12 w-12 text-warm-300" />
            <p className="mt-4 font-semibold text-warm-700">
              Nenhum recebimento
            </p>
            <p className="mt-1 text-sm text-warm-500">
              Os pagamentos de sessões realizadas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-200 text-left text-xs font-semibold text-warm-500">
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 pr-4">Paciente</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {filteredPayments.map((payment) => {
                  const date = new Date(payment.created_at);
                  return (
                    <tr key={payment.id} className="text-sm">
                      <td className="py-3 pr-4 text-warm-700">
                        {date.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 pr-4 font-medium text-warm-900">
                        {payment.patient_name}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${payment.appointment_type === "video" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}
                        >
                          {payment.appointment_type === "video"
                            ? "Vídeo"
                            : "Chat"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Pago
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} text-white shadow-md`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-warm-900">{value}</p>
      <p className="text-sm font-medium text-warm-700">{label}</p>
      <p className="text-xs text-warm-500">{sublabel}</p>
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const date = new Date(payment.created_at);

  return (
    <div className="flex items-center justify-between rounded-xl bg-warm-50 p-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${payment.appointment_type === "video" ? "bg-rose-100" : "bg-indigo-100"}`}
        >
          {payment.appointment_type === "video" ? (
            <VideoIcon className="h-5 w-5 text-rose-600" />
          ) : (
            <ChatIcon className="h-5 w-5 text-indigo-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-warm-900">
            {payment.patient_name}
          </p>
          <p className="text-xs text-warm-500">
            {date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}
          </p>
        </div>
      </div>
      <p className="font-bold text-emerald-600">
        {formatCurrency(payment.amount)}
      </p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Icons
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function TrendingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
