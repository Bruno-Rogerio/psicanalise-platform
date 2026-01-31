import { Section } from "./Section";

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description:
      "Um cadastro rápido e seguro. Em poucos instantes você já consegue seguir para o agendamento.",
    icon: UserPlusIcon,
  },
  {
    number: "02",
    title: "Escolha um horário",
    description:
      "Selecione o melhor dia e horário disponível. Tudo claro, sem burocracia.",
    icon: CalendarCheckIcon,
  },
  {
    number: "03",
    title: "Realize sua sessão",
    description:
      "No horário marcado, você acessa a plataforma e faz sua sessão com tranquilidade.",
    icon: VideoIcon,
  },
];

export function ComoFunciona() {
  return (
    <Section
      id="como-funciona"
      eyebrow="Como funciona"
      title="Simples por fora, profundo por dentro."
      subtitle="Você cuida da sua agenda. A sessão cuida do que precisa ser escutado."
      className="bg-soft-100/30"
    >
      {/* Connection line (desktop) */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-[72px] hidden h-px bg-gradient-to-r from-transparent via-warm-300/60 to-transparent sm:block" />

        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="group relative">
                {/* Card */}
                <div className="relative overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 p-7 shadow-soft backdrop-blur-sm transition-all duration-400 hover:border-warm-400/60 hover:bg-white hover:shadow-soft-lg">
                  {/* Step number badge */}
                  <div className="absolute -right-3 -top-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-400/10 to-warm-500/10 text-2xl font-bold text-warm-400/40">
                    {step.number}
                  </div>

                  {/* Icon container */}
                  <div className="relative z-10 mb-5 inline-flex">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500/15 to-sage-400/5 ring-1 ring-sage-500/20 transition-all duration-300 group-hover:ring-sage-500/40">
                      <Icon className="h-6 w-6 text-sage-600" />
                    </div>
                    {/* Connector dot */}
                    <div className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 items-center justify-center sm:flex">
                      <div className="h-2.5 w-2.5 rounded-full bg-warm-300 ring-4 ring-warm-100 transition-all duration-300 group-hover:bg-sage-500 group-hover:ring-sage-100" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-warm-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>

                  {/* Bottom gradient line */}
                  <div className="mt-6 h-px w-full bg-gradient-to-r from-warm-300/50 via-rose-300/30 to-transparent" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA after steps */}
      <div className="mt-10 flex justify-center">
        <a
          href="/cadastro"
          className="group inline-flex items-center gap-2 text-sm font-medium text-sage-600 transition-colors duration-300 hover:text-sage-700"
        >
          Pronto para começar?
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      </div>
    </Section>
  );
}

// Icons
function UserPlusIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}

function CalendarCheckIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 14l2 2 4-4"
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
        strokeWidth={1.5}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
