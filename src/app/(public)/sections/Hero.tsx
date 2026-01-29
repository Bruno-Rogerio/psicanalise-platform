import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        {/* Soft gradient orbs */}
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-rose-400/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-soft-400/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm-500/8 blur-3xl" />

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--accent-primary) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="py-16 sm:py-20 md:py-28">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2.5 rounded-full border border-warm-300/60 bg-white/60 px-4 py-2 text-sm text-muted backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
            </span>
            Atendimento psicanalítico online • ética • sigilo
          </div>

          {/* Heading */}
          <h1 className="animate-slide-up mt-8 max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight text-warm-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Um espaço seguro para{" "}
            <span className="text-gradient">falar, sentir</span>
            <br className="hidden sm:block" />
            <span className="text-warm-700"> e se escutar.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-slide-up mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl"
            style={{ animationDelay: "0.1s" }}
          >
            A psicanálise não é sobre "consertar" você. É sobre criar um lugar
            de escuta onde aquilo que pesa ganha nome, sentido e caminho.
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-slide-up mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/cadastro"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-500 px-7 py-4 text-base font-medium text-warm-50 shadow-soft transition-all duration-400 hover:bg-sage-600 hover:shadow-soft-lg sm:w-auto"
            >
              Começar agora
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
            </Link>

            <Link
              href="#como-funciona"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-warm-300/80 bg-white/60 px-7 py-4 text-base font-medium text-warm-900 backdrop-blur-sm transition-all duration-400 hover:border-warm-400 hover:bg-white/80 hover:shadow-soft sm:w-auto"
            >
              Entender como funciona
            </Link>
          </div>

          {/* Feature Cards */}
          <div
            className="animate-slide-up mt-16 grid gap-4 sm:grid-cols-3"
            style={{ animationDelay: "0.3s" }}
          >
            <FeatureCard
              icon={<HeartIcon />}
              title="Psicanálise"
              description="Escuta clínica e elaboração emocional, com profundidade e cuidado."
              accent="rose"
            />
            <FeatureCard
              icon={<CalendarIcon />}
              title="Organização"
              description="Agendamento simples, tudo no seu tempo, sem ruído e sem correria."
              accent="sage"
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title="Sigilo"
              description="Confidencialidade e ética como base, do início ao fim."
              accent="soft"
            />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-warm-100 to-transparent" />
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "rose" | "sage" | "soft";
}) {
  const accentColors = {
    rose: "from-rose-400/20 to-rose-300/10 border-rose-300/30",
    sage: "from-sage-400/20 to-sage-300/10 border-sage-300/30",
    soft: "from-soft-400/20 to-soft-300/10 border-soft-300/30",
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-warm-300/50 bg-white/70 p-6 shadow-soft backdrop-blur-sm transition-all duration-400 hover:-translate-y-1 hover:border-warm-400/50 hover:bg-white/90 hover:shadow-soft-lg">
      {/* Accent gradient background */}
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accentColors[accent]} opacity-60 blur-2xl transition-all duration-400 group-hover:opacity-100`}
      />

      <div className="relative">
        {/* Icon */}
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentColors[accent]} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>

        {/* Content */}
        <h3 className="mt-5 text-lg font-semibold text-warm-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

        {/* Decorative line */}
        <div className="mt-5 h-px w-full bg-gradient-to-r from-warm-300/60 via-warm-200/30 to-transparent" />
      </div>
    </div>
  );
}

// Icons
function HeartIcon() {
  return (
    <svg
      className="h-6 w-6 text-rose-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-6 w-6 text-sage-600"
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
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-6 w-6 text-soft-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}
