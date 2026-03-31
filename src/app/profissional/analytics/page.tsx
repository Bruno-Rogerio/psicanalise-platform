"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, subDays, eachDayOfInterval, subMonths, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

type Period = "7d" | "30d" | "90d";

type Pageview = { created_at: string; page_path: string };
type AnalyticsEvent = { created_at: string; event_name: string; event_category: string; event_label: string; page_path: string };

const CORAL = "#E8755A";
const SAGE = "#4A7C59";
const INDIGO = "#5B5EA6";
const AMBER = "#D4A72C";

const CTA_LABELS: Record<string, string> = {
  hero_comecar_agora: "Hero — Começar agora",
  hero_como_funciona: "Hero — Como funciona",
  como_funciona_comecar: "Como Funciona — Começar",
  como_funciona_login: "Como Funciona — Já tenho conta",
  contato_criar_conta: "Contato — Criar conta",
  contato_login: "Contato — Já tenho conta",
};

const SECTION_COLORS: Record<string, string> = {
  "Sobre": CORAL,
  "Como Funciona": SAGE,
  "Avaliações": INDIGO,
  "Contato": AMBER,
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [pageviews, setPageviews] = useState<Pageview[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/analytics/data?period=${period}`);
      const json = await res.json();
      setPageviews(json.pageviews || []);
      setEvents(json.events || []);
      setLoading(false);
    }
    load();
  }, [period]);

  // --- Totals ---
  const totalVisits = pageviews.length;
  const totalClicks = events.filter((e) => e.event_category === "cta").length;
  const totalSections = events.filter((e) => e.event_category === "section").length;
  const conversionRate = totalVisits > 0 ? ((totalClicks / totalVisits) * 100).toFixed(1) : "0";

  // --- Visits over time ---
  const visitsChart = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const interval = days <= 30
      ? eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() })
      : eachMonthOfInterval({ start: subMonths(new Date(), 2), end: new Date() });

    return interval.map((date) => {
      const label = days <= 30
        ? format(date, "dd/MM", { locale: ptBR })
        : format(date, "MMM", { locale: ptBR });

      const count = pageviews.filter((pv) => {
        const d = new Date(pv.created_at);
        if (days <= 30) {
          return (
            d.getDate() === date.getDate() &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        }
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      }).length;

      return { label, visits: count };
    });
  }, [pageviews, period]);

  // --- CTA clicks breakdown ---
  const ctaChart = useMemo(() => {
    const ctaEvents = events.filter((e) => e.event_category === "cta");
    const counts: Record<string, number> = {};
    for (const e of ctaEvents) {
      counts[e.event_label] = (counts[e.event_label] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label: CTA_LABELS[label] || label,
        count,
      }));
  }, [events]);

  // --- Section views ---
  const sectionChart = useMemo(() => {
    const sectionEvents = events.filter((e) => e.event_category === "section");
    const counts: Record<string, number> = {};
    for (const e of sectionEvents) {
      counts[e.event_label] = (counts[e.event_label] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [events]);

  // --- Scroll depth ---
  const scrollChart = useMemo(() => {
    const scrollEvents = events.filter((e) => e.event_name === "scroll_depth");
    return ["25%", "50%", "75%", "100%"].map((milestone) => ({
      label: milestone,
      count: scrollEvents.filter((e) => e.event_label === milestone).length,
    }));
  }, [events]);

  // --- Recent events ---
  const recentEvents = useMemo(
    () => [...events].reverse().slice(0, 20),
    [events]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B0A098]">Painel</p>
          <h1 className="mt-1 text-2xl font-black text-[#1A1614]">Analytics</h1>
        </div>

        {/* Period selector */}
        <div className="flex rounded-2xl border border-[#E8E0DC] bg-white p-1 shadow-sm">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                period === p
                  ? "bg-[#1A1614] text-white shadow-sm"
                  : "text-[#8B7B72] hover:text-[#1A1614]",
              ].join(" ")}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label="Visitas" value={totalVisits} icon="👁" color={CORAL} />
            <KPICard label="Cliques em CTAs" value={totalClicks} icon="🖱" color={SAGE} />
            <KPICard label="Seções vistas" value={totalSections} icon="📖" color={INDIGO} />
            <KPICard label="Taxa de clique" value={`${conversionRate}%`} icon="📈" color={AMBER} />
          </div>

          {/* Visits over time */}
          <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-base font-bold text-[#1A1614]">Visitas ao site</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={visitsChart} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#B0A098" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#B0A098" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E8E0DC", fontSize: 12 }}
                  labelStyle={{ fontWeight: 700, color: "#1A1614" }}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke={CORAL}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: CORAL }}
                  name="Visitas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 2-col row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* CTA Clicks */}
            <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-[#1A1614]">Cliques por CTA</h2>
              {ctaChart.length === 0 ? (
                <EmptyState label="Nenhum clique registrado ainda" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ctaChart} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#B0A098" }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#8B7B72" }}
                      tickLine={false}
                      axisLine={false}
                      width={140}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E8E0DC", fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Cliques">
                      {ctaChart.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? CORAL : i === 1 ? SAGE : INDIGO} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Section views */}
            <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-[#1A1614]">Seções mais vistas</h2>
              {sectionChart.length === 0 ? (
                <EmptyState label="Nenhuma visualização registrada ainda" />
              ) : (
                <div className="space-y-3">
                  {sectionChart.map((item, i) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: SECTION_COLORS[item.label] || CORAL }}
                      />
                      <p className="flex-1 text-sm text-[#4A3F3A]">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-[#F2EDE8]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.count / (sectionChart[0]?.count || 1)) * 100}%`,
                              backgroundColor: SECTION_COLORS[item.label] || CORAL,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right text-sm font-bold text-[#1A1614]">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scroll depth */}
          <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-base font-bold text-[#1A1614]">Profundidade de scroll</h2>
            <p className="mb-5 text-sm text-[#8B7B72]">Quantas sessões chegaram até cada ponto da página</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scrollChart} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE6" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#8B7B72" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#B0A098" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E8E0DC", fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Sessões">
                  {scrollChart.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`rgba(74, 124, 89, ${0.35 + i * 0.2})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent events */}
          <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-base font-bold text-[#1A1614]">Eventos recentes</h2>
            {recentEvents.length === 0 ? (
              <EmptyState label="Nenhum evento registrado ainda" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0EBE6]">
                      <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-[#B0A098]">Evento</th>
                      <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-[#B0A098]">Label</th>
                      <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-[#B0A098]">Página</th>
                      <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-[#B0A098]">Horário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F0ED]">
                    {recentEvents.map((ev, i) => (
                      <tr key={i} className="group">
                        <td className="py-3">
                          <span className={[
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            ev.event_category === "cta" ? "bg-[#E8755A]/10 text-[#E8755A]" :
                            ev.event_category === "section" ? "bg-[#4A7C59]/10 text-[#4A7C59]" :
                            "bg-[#5B5EA6]/10 text-[#5B5EA6]",
                          ].join(" ")}>
                            {ev.event_name}
                          </span>
                        </td>
                        <td className="py-3 text-[#4A3F3A]">
                          {CTA_LABELS[ev.event_label] || ev.event_label || "—"}
                        </td>
                        <td className="py-3 text-[#8B7B72]">{ev.page_path || "—"}</td>
                        <td className="py-3 text-right text-[#B0A098]">
                          {format(new Date(ev.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#B0A098]">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-sm text-[#B0A098]">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-[#E8E0DC]/40" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-[#E8E0DC]/40" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-3xl bg-[#E8E0DC]/40" />
        <div className="h-56 animate-pulse rounded-3xl bg-[#E8E0DC]/40" />
      </div>
    </div>
  );
}
