import { Section } from "./Section";

const steps = [
  {
    title: "Crie sua conta",
    desc: "Um cadastro rápido e seguro. Em poucos instantes você já consegue seguir para o agendamento.",
  },
  {
    title: "Escolha um horário",
    desc: "Selecione o melhor dia e horário disponível. Tudo claro, sem burocracia.",
  },
  {
    title: "Realize sua sessão",
    desc: "No horário marcado, você acessa a plataforma e faz sua sessão com tranquilidade.",
  },
];

export function ComoFunciona() {
  return (
    <Section
      id="como-funciona"
      eyebrow="Como funciona"
      title="Simples por fora, profundo por dentro."
      subtitle="Você cuida da sua agenda. A sessão cuida do que precisa ser escutado."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((s, idx) => (
          <div
            key={s.title}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900">
                {idx + 1}
              </span>
              <p className="text-sm font-semibold text-zinc-900">{s.title}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#6F6F6F]">
              {s.desc}
            </p>
            <div className="mt-5 h-px w-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent" />
          </div>
        ))}
      </div>
    </Section>
  );
}
