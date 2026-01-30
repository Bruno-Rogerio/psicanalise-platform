// src/app/profissional/configuracoes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type AppointmentType = "video" | "chat";

type AvailabilityRule = {
  id?: string;
  weekday: WeekDay;
  start_time: string;
  end_time: string;
  appointment_type: AppointmentType;
};

type Settings = {
  session_duration_video_min: number;
  session_duration_chat_min: number;
  min_cancel_hours: number;
  timezone: string;
};

type Profile = {
  nome: string;
  email: string;
  crp: string;
};

const weekDayLabels: Record<WeekDay, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "availability" | "settings" | "profile"
  >("availability");

  // Availability
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [newRuleType, setNewRuleType] = useState<AppointmentType>("video");

  // Settings
  const [settings, setSettings] = useState<Settings>({
    session_duration_video_min: 50,
    session_duration_chat_min: 30,
    min_cancel_hours: 24,
    timezone: "America/Sao_Paulo",
  });

  // Profile
  const [profile, setProfile] = useState<Profile>({
    nome: "",
    email: "",
    crp: "",
  });

  const [profissionalId, setProfissionalId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) return;

        setProfissionalId(auth.user.id);

        // Load profile (only columns that exist)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nome, crp")
          .eq("id", auth.user.id)
          .single();

        if (profileData) {
          setProfile({
            nome: profileData.nome || "",
            email: auth.user.email || "",
            crp: profileData.crp || "",
          });
        } else {
          setProfile({
            nome: "",
            email: auth.user.email || "",
            crp: "",
          });
        }

        // Load settings (only columns that exist)
        const { data: settingsData } = await supabase
          .from("professional_settings")
          .select(
            "session_duration_video_min, session_duration_chat_min, min_cancel_hours, timezone",
          )
          .eq("profissional_id", auth.user.id)
          .single();

        if (settingsData) {
          setSettings({
            session_duration_video_min:
              settingsData.session_duration_video_min || 50,
            session_duration_chat_min:
              settingsData.session_duration_chat_min || 30,
            min_cancel_hours: settingsData.min_cancel_hours || 24,
            timezone: settingsData.timezone || "America/Sao_Paulo",
          });
        }

        // Load availability rules
        const { data: rulesData } = await supabase
          .from("availability_rules")
          .select("id, weekday, start_time, end_time, appointment_type")
          .eq("profissional_id", auth.user.id)
          .order("weekday", { ascending: true });

        if (rulesData) {
          setRules(rulesData as AvailabilityRule[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Add availability rule
  function addRule(weekday: WeekDay) {
    setRules([
      ...rules,
      {
        weekday,
        start_time: "08:00",
        end_time: "18:00",
        appointment_type: newRuleType,
      },
    ]);
  }

  // Remove availability rule
  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  // Update rule
  function updateRule(
    index: number,
    field: keyof AvailabilityRule,
    value: string,
  ) {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  }

  // Save availability
  async function saveAvailability() {
    if (!profissionalId) return;

    try {
      setSaving(true);

      // Delete existing rules
      await supabase
        .from("availability_rules")
        .delete()
        .eq("profissional_id", profissionalId);

      // Insert new rules
      if (rules.length > 0) {
        const { error } = await supabase.from("availability_rules").insert(
          rules.map((r) => ({
            profissional_id: profissionalId,
            weekday: r.weekday,
            start_time: r.start_time,
            end_time: r.end_time,
            appointment_type: r.appointment_type,
          })),
        );

        if (error) throw error;
      }

      alert("Disponibilidade salva ✓");
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // Save settings
  async function saveSettings() {
    if (!profissionalId) return;

    try {
      setSaving(true);

      const { error } = await supabase.from("professional_settings").upsert(
        {
          profissional_id: profissionalId,
          session_duration_video_min: settings.session_duration_video_min,
          session_duration_chat_min: settings.session_duration_chat_min,
          min_cancel_hours: settings.min_cancel_hours,
          timezone: settings.timezone,
        },
        { onConflict: "profissional_id" },
      );

      if (error) throw error;

      alert("Configurações salvas ✓");
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // Save profile
  async function saveProfile() {
    if (!profissionalId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          nome: profile.nome,
          crp: profile.crp,
        })
        .eq("id", profissionalId);

      if (error) throw error;

      alert("Perfil salvo ✓");
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-500 to-warm-600 shadow-lg">
          <SettingsIcon className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Configurações</h1>
          <p className="text-sm text-warm-600">
            Gerencie sua disponibilidade e perfil
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex rounded-xl border border-warm-200 bg-warm-50 p-1">
        {(["availability", "settings", "profile"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-[#4A7C59] text-white shadow"
                : "text-warm-600 hover:text-warm-900"
            }`}
          >
            {tab === "availability"
              ? "Disponibilidade"
              : tab === "settings"
                ? "Sessões"
                : "Perfil"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "availability" && (
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-warm-900">
                Horários de Atendimento
              </h2>
              <p className="text-sm text-warm-500">
                Defina os horários em que você está disponível para sessões
              </p>
            </div>
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="rounded-xl bg-[#4A7C59] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3d6649] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {/* Type selector for new rules */}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-warm-50 p-3">
            <span className="text-sm font-medium text-warm-700">
              Tipo para novos horários:
            </span>
            <div className="flex rounded-lg border border-warm-200 bg-white p-1">
              <button
                onClick={() => setNewRuleType("video")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  newRuleType === "video"
                    ? "bg-rose-100 text-rose-700"
                    : "text-warm-600 hover:text-warm-900"
                }`}
              >
                Vídeo
              </button>
              <button
                onClick={() => setNewRuleType("chat")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  newRuleType === "chat"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-warm-600 hover:text-warm-900"
                }`}
              >
                Chat
              </button>
            </div>
          </div>

          {/* Days */}
          <div className="mt-6 space-y-4">
            {([1, 2, 3, 4, 5, 6, 0] as WeekDay[]).map((weekday) => {
              const dayRules = rules.filter((r) => r.weekday === weekday);

              return (
                <div
                  key={weekday}
                  className="rounded-xl border border-warm-200 bg-warm-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-warm-900">
                      {weekDayLabels[weekday]}
                    </p>
                    <button
                      onClick={() => addRule(weekday)}
                      className="text-sm font-medium text-[#4A7C59] hover:underline"
                    >
                      + Adicionar horário
                    </button>
                  </div>

                  {dayRules.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {rules.map((rule, index) => {
                        if (rule.weekday !== weekday) return null;

                        return (
                          <div
                            key={index}
                            className="flex flex-wrap items-center gap-3"
                          >
                            <select
                              value={rule.appointment_type}
                              onChange={(e) =>
                                updateRule(
                                  index,
                                  "appointment_type",
                                  e.target.value,
                                )
                              }
                              className={`rounded-lg border px-2 py-2 text-xs font-semibold outline-none ${
                                rule.appointment_type === "video"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              <option value="video">Vídeo</option>
                              <option value="chat">Chat</option>
                            </select>
                            <input
                              type="time"
                              value={rule.start_time}
                              onChange={(e) =>
                                updateRule(index, "start_time", e.target.value)
                              }
                              className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 outline-none focus:border-sage-400"
                            />
                            <span className="text-warm-500">até</span>
                            <input
                              type="time"
                              value={rule.end_time}
                              onChange={(e) =>
                                updateRule(index, "end_time", e.target.value)
                              }
                              className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 outline-none focus:border-sage-400"
                            />
                            <button
                              onClick={() => removeRule(index)}
                              className="rounded-lg bg-rose-100 p-2 text-rose-600 hover:bg-rose-200"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-warm-500">
                      Sem disponibilidade
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-warm-900">
                Configurações de Sessão
              </h2>
              <p className="text-sm text-warm-500">
                Defina duração e intervalos entre sessões
              </p>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-xl bg-[#4A7C59] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3d6649] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <SettingField
              label="Duração da Videochamada"
              suffix="minutos"
              value={settings.session_duration_video_min}
              onChange={(v) =>
                setSettings({ ...settings, session_duration_video_min: v })
              }
            />
            <SettingField
              label="Duração do Chat"
              suffix="minutos"
              value={settings.session_duration_chat_min}
              onChange={(v) =>
                setSettings({ ...settings, session_duration_chat_min: v })
              }
            />
            <SettingField
              label="Antecedência mínima para cancelar"
              suffix="horas"
              value={settings.min_cancel_hours}
              onChange={(v) =>
                setSettings({ ...settings, min_cancel_hours: v })
              }
            />
            <div>
              <label className="mb-2 block text-sm font-semibold text-warm-700">
                Fuso horário
              </label>
              <select
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                className="w-full rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none focus:border-sage-400"
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
                <option value="America/Recife">Recife (GMT-3)</option>
                <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                <option value="America/Belem">Belém (GMT-3)</option>
                <option value="America/Cuiaba">Cuiabá (GMT-4)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-warm-900">
                Perfil Profissional
              </h2>
              <p className="text-sm text-warm-500">
                Informações exibidas para pacientes
              </p>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-[#4A7C59] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3d6649] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-warm-700">
                Nome completo
              </label>
              <input
                type="text"
                value={profile.nome}
                onChange={(e) =>
                  setProfile({ ...profile, nome: e.target.value })
                }
                className="w-full rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-warm-700">
                E-mail
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-xl border border-warm-200 bg-warm-100 px-4 py-3 text-warm-500 outline-none"
              />
              <p className="mt-1 text-xs text-warm-500">
                O e-mail não pode ser alterado aqui
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-warm-700">
                CRP
              </label>
              <input
                type="text"
                value={profile.crp}
                onChange={(e) =>
                  setProfile({ ...profile, crp: e.target.value })
                }
                placeholder="Ex: 06/12345"
                className="w-full rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingField({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-warm-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-24 rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 outline-none focus:border-sage-400"
        />
        <span className="text-sm text-warm-500">{suffix}</span>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-warm-200" />
      <div className="h-12 animate-pulse rounded-xl bg-warm-200" />
      <div className="h-96 animate-pulse rounded-2xl bg-warm-200" />
    </div>
  );
}

// Icons
function SettingsIcon({ className }: { className?: string }) {
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
