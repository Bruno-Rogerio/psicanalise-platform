// src/app/profissional/configuracoes/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";
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

type TabKey = "availability" | "settings" | "profile";

type BreakEditorState = {
  index: number; // index in rules array
  start: string;
  end: string;
  error?: string;
} | null;

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("availability");

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

  // Pausa inline editor
  const [breakEditor, setBreakEditor] = useState<BreakEditorState>(null);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) return;

        setProfissionalId(auth.user.id);

        // Load profile
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

        // Load settings
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
    setBreakEditor(null);
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
    setBreakEditor((cur) => (cur?.index === index ? null : cur));
    setRules(rules.filter((_, i) => i !== index));
  }

  // Update rule
  function updateRule(
    index: number,
    field: keyof AvailabilityRule,
    value: string,
  ) {
    setRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    setBreakEditor((cur) => {
      if (!cur || cur.index !== index) return cur;
      return { ...cur, error: undefined };
    });
  }

  // PAUSA / SPLIT INTELIGENTE

  function openBreakEditor(index: number) {
    const r = rules[index];
    if (!r) return;

    const defaultStart = clampTime("12:00", r.start_time, r.end_time);
    const defaultEnd = clampTime("13:00", r.start_time, r.end_time);

    setBreakEditor({
      index,
      start: defaultStart,
      end: defaultEnd,
      error: undefined,
    });
  }

  function closeBreakEditor() {
    setBreakEditor(null);
  }

  function applyBreakSplit() {
    if (!breakEditor) return;

    const idx = breakEditor.index;
    const r = rules[idx];
    if (!r) return;

    const breakStart = breakEditor.start;
    const breakEnd = breakEditor.end;

    if (!isTimeLess(breakStart, breakEnd)) {
      setBreakEditor((cur) =>
        cur
          ? { ...cur, error: "A pausa precisa ter início antes do fim." }
          : cur,
      );
      return;
    }

    if (
      isTimeLess(breakStart, r.start_time) ||
      isTimeLess(r.end_time, breakEnd) ||
      breakStart === r.end_time ||
      breakEnd === r.start_time
    ) {
      setBreakEditor((cur) =>
        cur
          ? {
              ...cur,
              error:
                "A pausa precisa estar dentro do intervalo do atendimento.",
            }
          : cur,
      );
      return;
    }

    const parts: AvailabilityRule[] = [];

    if (isTimeLess(r.start_time, breakStart)) {
      parts.push({
        weekday: r.weekday,
        appointment_type: r.appointment_type,
        start_time: r.start_time,
        end_time: breakStart,
      });
    }

    if (isTimeLess(breakEnd, r.end_time)) {
      parts.push({
        weekday: r.weekday,
        appointment_type: r.appointment_type,
        start_time: breakEnd,
        end_time: r.end_time,
      });
    }

    if (parts.length === 0) {
      setBreakEditor((cur) =>
        cur
          ? {
              ...cur,
              error:
                "Essa pausa remove todo o intervalo. Ajuste os horários da pausa.",
            }
          : cur,
      );
      return;
    }

    setRules((prev) => {
      const next = [...prev];
      next.splice(idx, 1, ...parts);
      return sortRules(next);
    });

    setBreakEditor(null);
  }

  // Save availability
  async function saveAvailability() {
    if (!profissionalId) return;

    try {
      setSaving(true);

      setBreakEditor(null);

      for (const r of rules) {
        if (!isTimeLess(r.start_time, r.end_time)) {
          throw new Error(
            `Existe um horário inválido em ${weekDayLabels[r.weekday]} (${r.start_time}–${r.end_time}).`,
          );
        }
      }

      await supabase
        .from("availability_rules")
        .delete()
        .eq("profissional_id", profissionalId);

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

      toast("Disponibilidade salva!", "success");
    } catch (e: any) {
      toast(e?.message ?? "Erro ao salvar", "error");
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

      toast("Configurações salvas!", "success");
    } catch (e: any) {
      toast(e?.message ?? "Erro ao salvar", "error");
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

      toast("Perfil salvo!", "success");
    } catch (e: any) {
      toast(e?.message ?? "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  }

  const rulesByWeekday = useMemo(() => {
    const map: Record<WeekDay, { rule: AvailabilityRule; index: number }[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    rules.forEach((r, index) => {
      map[r.weekday].push({ rule: r, index });
    });

    (Object.keys(map) as unknown as WeekDay[]).forEach((wd) => {
      map[wd].sort((a, b) => {
        if (a.rule.appointment_type !== b.rule.appointment_type) {
          return a.rule.appointment_type.localeCompare(b.rule.appointment_type);
        }
        return a.rule.start_time.localeCompare(b.rule.start_time);
      });
    });

    return map;
  }, [rules]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">Profissional</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">Configurações</h1>
          <p className="mt-1 text-sm text-[#8B7B72]">Disponibilidade, perfil e preferências</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-1">
        {(["availability", "settings", "profile"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-[#1A1614] text-white shadow"
                : "text-[#8B7B72] hover:text-[#2C2420]"
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
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
          <div className="flex items-center justify-between border-b border-[#E8E0DC] px-6 py-4">
            <div>
              <p className="text-sm font-bold text-[#2C2420]">Horários de Atendimento</p>
              <p className="text-xs text-[#8B7B72]">Defina o intervalo e adicione pausas dentro dele com um clique</p>
            </div>
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2A2320] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          <div className="p-6">
            {/* Type selector for new rules */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#F8F4F1] p-3">
              <span className="text-sm font-semibold text-[#8B7B72]">
                Tipo para novos horários:
              </span>
              <div className="flex rounded-xl border border-[#E8E0DC] bg-white p-1">
                <button
                  onClick={() => setNewRuleType("video")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    newRuleType === "video"
                      ? "bg-rose-50 text-rose-700"
                      : "text-[#8B7B72] hover:text-[#2C2420]"
                  }`}
                >
                  Vídeo
                </button>
                <button
                  onClick={() => setNewRuleType("chat")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    newRuleType === "chat"
                      ? "bg-[#F5F0ED] text-[#8B7B72]"
                      : "text-[#8B7B72] hover:text-[#2C2420]"
                  }`}
                >
                  Chat
                </button>
              </div>
            </div>

            {/* Days */}
            <div className="space-y-4">
              {([1, 2, 3, 4, 5, 6, 0] as WeekDay[]).map((weekday) => {
                const dayRules = rulesByWeekday[weekday];

                return (
                  <div
                    key={weekday}
                    className="rounded-2xl border border-[#E8E0DC] bg-[#FAFAF8] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#2C2420]">
                        {weekDayLabels[weekday]}
                      </p>
                      <button
                        onClick={() => addRule(weekday)}
                        className="text-sm font-semibold text-[#4A7C59] hover:underline"
                      >
                        + Adicionar intervalo
                      </button>
                    </div>

                    {dayRules.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {dayRules.map(({ rule, index }) => {
                          const isEditingBreak = breakEditor?.index === index;

                          return (
                            <div
                              key={`${weekday}-${index}`}
                              className="rounded-2xl border border-[#E8E0DC] bg-white p-3"
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <select
                                  value={rule.appointment_type}
                                  onChange={(e) =>
                                    updateRule(
                                      index,
                                      "appointment_type",
                                      e.target.value,
                                    )
                                  }
                                  className={`rounded-xl border px-2 py-2 text-xs font-semibold outline-none ${
                                    rule.appointment_type === "video"
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-[#E8E0DC] bg-[#F5F0ED] text-[#8B7B72]"
                                  }`}
                                >
                                  <option value="video">Vídeo</option>
                                  <option value="chat">Chat</option>
                                </select>

                                <input
                                  type="time"
                                  value={rule.start_time}
                                  onChange={(e) =>
                                    updateRule(
                                      index,
                                      "start_time",
                                      e.target.value,
                                    )
                                  }
                                  className="rounded-xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm text-[#2C2420] outline-none focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                                />

                                <span className="text-sm text-[#B0A098]">até</span>

                                <input
                                  type="time"
                                  value={rule.end_time}
                                  onChange={(e) =>
                                    updateRule(index, "end_time", e.target.value)
                                  }
                                  className="rounded-xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm text-[#2C2420] outline-none focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                                />

                                {/* Pausa inteligente */}
                                <button
                                  onClick={() =>
                                    isEditingBreak
                                      ? closeBreakEditor()
                                      : openBreakEditor(index)
                                  }
                                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                                    isEditingBreak
                                      ? "bg-[#F5F0ED] text-[#8B7B72]"
                                      : "bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20"
                                  }`}
                                >
                                  {isEditingBreak ? "Fechar pausa" : "Pausa"}
                                </button>

                                <button
                                  onClick={() => removeRule(index)}
                                  className="ml-auto rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                                  title="Remover intervalo"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Editor de pausa */}
                              {isEditingBreak && breakEditor && (
                                <div className="mt-3 rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-3">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-semibold text-[#2C2420]">
                                      Bloquear intervalo:
                                    </span>

                                    <input
                                      type="time"
                                      value={breakEditor.start}
                                      onChange={(e) =>
                                        setBreakEditor((cur) =>
                                          cur
                                            ? {
                                                ...cur,
                                                start: e.target.value,
                                                error: undefined,
                                              }
                                            : cur,
                                        )
                                      }
                                      className="rounded-xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm text-[#2C2420] outline-none focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                                    />

                                    <span className="text-sm text-[#B0A098]">até</span>

                                    <input
                                      type="time"
                                      value={breakEditor.end}
                                      onChange={(e) =>
                                        setBreakEditor((cur) =>
                                          cur
                                            ? {
                                                ...cur,
                                                end: e.target.value,
                                                error: undefined,
                                              }
                                            : cur,
                                        )
                                      }
                                      className="rounded-xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm text-[#2C2420] outline-none focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                                    />

                                    {/* presets */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        onClick={() =>
                                          setBreakEditor((cur) =>
                                            cur
                                              ? {
                                                  ...cur,
                                                  start: "12:00",
                                                  end: "13:00",
                                                  error: undefined,
                                                }
                                              : cur,
                                          )
                                        }
                                        className="rounded-xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm font-semibold text-[#2C2420] hover:bg-[#F8F4F1]"
                                      >
                                        Almoço 12–13
                                      </button>
                                      <button
                                        onClick={() =>
                                          setBreakEditor((cur) =>
                                            cur
                                              ? {
                                                  ...cur,
                                                  start: "11:00",
                                                  end: "12:00",
                                                  error: undefined,
                                                }
                                              : cur,
                                          )
                                        }
                                        className="rounded-xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm font-semibold text-[#2C2420] hover:bg-[#F8F4F1]"
                                      >
                                        11–12
                                      </button>
                                    </div>

                                    <div className="ml-auto flex items-center gap-2">
                                      <button
                                        onClick={closeBreakEditor}
                                        className="rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2 text-sm font-semibold text-[#2C2420] transition-all hover:bg-[#F8F4F1]"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={applyBreakSplit}
                                        className="rounded-2xl bg-[#1A1614] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#2A2320]"
                                      >
                                        Aplicar pausa
                                      </button>
                                    </div>
                                  </div>

                                  {breakEditor.error && (
                                    <p className="mt-2 text-sm font-semibold text-rose-700">
                                      {breakEditor.error}
                                    </p>
                                  )}

                                  <p className="mt-2 text-xs text-[#8B7B72]">
                                    Ao aplicar, o sistema divide automaticamente
                                    seu intervalo em dois blocos.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#B0A098]">
                        Sem disponibilidade
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
          <div className="flex items-center justify-between border-b border-[#E8E0DC] px-6 py-4">
            <div>
              <p className="text-sm font-bold text-[#2C2420]">Configurações de Sessão</p>
              <p className="text-xs text-[#8B7B72]">Defina duração e regras gerais</p>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2A2320] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          <div className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
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
                <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
                  Fuso horário
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings({ ...settings, timezone: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
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
        </div>
      )}

      {activeTab === "profile" && (
        <div className="rounded-3xl border border-[#E8E0DC]/80 bg-white shadow-[0_1px_16px_rgba(44,36,32,0.07)]">
          <div className="flex items-center justify-between border-b border-[#E8E0DC] px-6 py-4">
            <div>
              <p className="text-sm font-bold text-[#2C2420]">Perfil Profissional</p>
              <p className="text-xs text-[#8B7B72]">Informações exibidas para pacientes</p>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2A2320] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          <div className="space-y-5 p-6">
            <LogoUploader toast={toast} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
                Nome completo
              </label>
              <input
                type="text"
                value={profile.nome}
                onChange={(e) =>
                  setProfile({ ...profile, nome: e.target.value })
                }
                className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
                E-mail
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] px-4 py-3 text-sm text-[#B0A098] outline-none"
              />
              <p className="mt-1 text-xs text-[#B0A098]">
                O e-mail não pode ser alterado aqui
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
                CRP
              </label>
              <input
                type="text"
                value={profile.crp}
                onChange={(e) =>
                  setProfile({ ...profile, crp: e.target.value })
                }
                placeholder="Ex: 06/12345"
                className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STORAGE_LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/logo.jpeg`;

function LogoUploader({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast("Formato inválido. Use JPG, PNG ou WebP.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Imagem muito grande. Máximo 5MB.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profissional/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no upload");

      // Adiciona timestamp para forçar reload da imagem no preview
      setPreview(`${data.url}?v=${Date.now()}`);
      toast("Logo atualizado com sucesso!", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao fazer upload";
      toast(message, "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
        Logo da plataforma
      </label>
      <p className="mb-4 text-xs text-[#8B7B72]">
        Exibido no header, footer e páginas de acesso. JPG, PNG ou WebP • Máx. 5MB
      </p>

      <div className="flex items-center gap-5">
        {/* Preview */}
        <div className="flex h-20 w-40 items-center justify-center overflow-hidden rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] px-3">
          <Image
            src={preview ?? `${STORAGE_LOGO_URL}?v=init`}
            alt="Logo atual"
            width={140}
            height={40}
            className="h-14 w-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.jpeg";
            }}
            unoptimized={!!preview}
          />
        </div>

        {/* Botão */}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2420] transition-all hover:border-[#4A7C59] hover:text-[#4A7C59] disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Trocar logo
              </>
            )}
          </button>
          {preview && (
            <p className="mt-1.5 text-xs text-[#4A7C59]">Logo atualizado</p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-[#E8E0DC]" />
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
      <label className="mb-2 block text-sm font-semibold text-[#2C2420]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-24 rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
        />
        <span className="text-sm text-[#8B7B72]">{suffix}</span>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-3xl bg-[#F5F0ED]" />
      <div className="h-12 animate-pulse rounded-2xl bg-[#F5F0ED]" />
      <div className="h-96 animate-pulse rounded-3xl bg-[#F5F0ED]" />
    </div>
  );
}

// ======= helpers de horário (string HH:mm) =======

function isTimeLess(a: string, b: string) {
  return toMinutes(a) < toMinutes(b);
}

function toMinutes(t: string) {
  const [hh, mm] = t.split(":").map((n) => parseInt(n, 10));
  return hh * 60 + mm;
}

function clampTime(t: string, min: string, max: string) {
  const x = toMinutes(t);
  const a = toMinutes(min);
  const b = toMinutes(max);
  const clamped = Math.max(a, Math.min(b, x));
  const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
  const mm = String(clamped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function sortRules(arr: AvailabilityRule[]) {
  const next = [...arr];
  next.sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    if (a.appointment_type !== b.appointment_type) {
      return a.appointment_type.localeCompare(b.appointment_type);
    }
    if (a.start_time !== b.start_time)
      return a.start_time.localeCompare(b.start_time);
    return a.end_time.localeCompare(b.end_time);
  });
  return next;
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
