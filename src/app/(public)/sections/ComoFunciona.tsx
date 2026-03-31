import { Reveal } from "@/components/ui/Reveal";
import { TrackedLink } from "@/components/ui/TrackedLink";

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Um cadastro rápido e seguro. Em poucos instantes você já consegue seguir para o agendamento.",
    icon: UserPlusIcon,
    color: "#E8755A",
    bg: "#E8755A15",
  },
  {
    number: "02",
    title: "Escolha um horário",
    description: "Selecione o melhor dia e horário disponível. Tudo claro, sem burocracia.",
    icon: CalendarCheckIcon,
    color: "#4A7C59",
    bg: "#4A7C5915",
  },
  {
    number: "03",
    title: "Realize sua sessão",
    description: "No horário marcado, você acessa a plataforma e faz sua sessão com tranquilidade.",
    icon: VideoIcon,
    color: "#5B5EA6",
    bg: "#5B5EA615",
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="relative overflow-hidden bg-[#F2EDE8] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#E8755A]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#4A7C59]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6">

        {/* Header */}
        <Reveal direction="up" delay={0} className="mb-16 max-w-2xl" trackSection="Como Funciona">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B0A098]">
            Como funciona
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#1A1614] sm:text-5xl">
            Simples por fora,{" "}
            <span className="italic text-[#4A7C59]">profundo por dentro.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#8B7B72]">
            Você cuida da sua agenda. A sessão cuida do que precisa ser escutado.
          </p>
        </Reveal>

        {/* Steps */}
        <div className="space-y-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} direction="left" delay={idx * 120}>
                <div className="group flex items-start gap-6 rounded-3xl border border-[#E8E0DC]/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:gap-8 sm:p-8">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-[#1A1614]">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-[#8B7B72]">{step.description}</p>
                  </div>

                  <div
                    className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 sm:flex"
                    style={{ backgroundColor: step.bg }}
                  >
                    <Icon className="h-6 w-6" style={{ color: step.color }} />
                  </div>

                  <div className="hidden shrink-0 items-center text-[#D0C8C0] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#B0A098] lg:flex">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA */}
        <Reveal direction="up" delay={100} className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <TrackedLink
            href="/cadastro"
            eventLabel="como_funciona_comecar"
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-[#1A1614] px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2C2420] hover:shadow-2xl"
          >
            Pronto para começar?
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </TrackedLink>
          <TrackedLink
            href="/login"
            eventLabel="como_funciona_login"
            className="text-sm font-medium text-[#8B7B72] underline-offset-4 transition-colors hover:text-[#1A1614] hover:underline"
          >
            Já tenho conta
          </TrackedLink>
        </Reveal>
      </div>
    </section>
  );
}

function UserPlusIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}

function CalendarCheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l2 2 4-4" />
    </svg>
  );
}

function VideoIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
