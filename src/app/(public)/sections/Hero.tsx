import Link from "next/link";
import React from "react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Base wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-warm-100 via-warm-100/90 to-warm-100" />

        {/* Soft orbs with better placement */}
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-rose-400/10 blur-3xl" />
        <div className="absolute -bottom-44 right-[-12%] h-[560px] w-[560px] rounded-full bg-soft-400/12 blur-3xl" />
        <div className="absolute top-[35%] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-warm-500/8 blur-3xl" />

        {/* Subtle grid dots with mask */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--accent-primary) 1px, transparent 0)",
            backgroundSize: "34px 34px",
            maskImage:
              "radial-gradient(ellipse at 50% 25%, black 40%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 25%, black 40%, transparent 70%)",
          }}
        />

        {/* Gentle vignette for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-warm-100/90" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="pt-10 pb-16 sm:pt-12 sm:pb-20 md:pt-14 md:pb-24">
          {/* Badge */}
          <div className="animate-fade-in inline-flex max-w-full items-center gap-2.5 rounded-full border border-warm-300/60 bg-white/70 px-4 py-2 text-sm text-muted shadow-soft backdrop-blur-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
            </span>
            <span className="truncate sm:whitespace-nowrap">
              O que você sente faz sentido. Vamos olhar para isso com cuidado.
            </span>
          </div>

          {/* Heading */}
          <h1 className="animate-slide-up mt-6 max-w-4xl text-4xl font-semibold leading-[1.06] tracking-tight text-warm-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Um espaço para você{" "}
            <span className="text-gradient">falar do que sente</span>
            <br className="hidden sm:block" />
            <span className="text-warm-700">
              {" "}
              sem medo, sem julgamentos e no seu tempo.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-slide-up mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl"
            style={{ animationDelay: "0.08s" }}
          >
            A psicanálise não é sobre "consertar" você. É sobre criar um lugar
            de escuta onde aquilo que pesa ganha nome, sentido e caminho.
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-slide-up mt-08 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "0.16s" }}
          >
            <Link
              href="/cadastro"
              className={[
                "group inline-flex w-full items-center justify-center gap-2 rounded-2xl",
                "bg-sage-600 px-7 py-4 text-base font-medium text-warm-50 shadow-soft",
                "transition-all duration-300 hover:bg-sage-700 hover:shadow-soft-lg",
                "active:scale-[0.99]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-100",
                "sm:w-auto",
              ].join(" ")}
            >
              Começar agora
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
              className={[
                "inline-flex w-full items-center justify-center rounded-2xl",
                "border border-warm-300/80 bg-white/70 px-7 py-4 text-base font-medium text-warm-900",
                "backdrop-blur-sm shadow-soft",
                "transition-all duration-300 hover:border-warm-400/80 hover:bg-white/85 hover:shadow-soft-lg",
                "active:scale-[0.99]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-100",
                "sm:w-auto",
              ].join(" ")}
            >
              Entender como funciona
            </Link>
          </div>

          {/* Feature Cards */}
          <div
            className="animate-slide-up mt-12 grid gap-4 sm:mt-16 sm:grid-cols-3"
            style={{ animationDelay: "0.24s" }}
          >
            <FeatureCard
              icon={<HeartIcon />}
              title="Psicanálise"
              description="Um lugar para falar do que dói e olhar para isso com cuidado."
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

          {/* Tiny reassurance line (optional but classy) */}
          <div
            className="animate-slide-up mt-08 flex items-center gap-3 text-sm text-muted"
            style={{ animationDelay: "0.28s" }}
          >
            <div className="h-px w-10 bg-gradient-to-r from-warm-300/60 to-transparent" />
            <span>Atendimento com acolhimento, clareza e presença.</span>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
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
  const accentOrb = {
    rose: "from-rose-400/18 to-rose-300/10",
    sage: "from-sage-400/18 to-sage-300/10",
    soft: "from-soft-400/18 to-soft-300/10",
  }[accent];

  const accentRing = {
    rose: "group-hover:ring-rose-400/15",
    sage: "group-hover:ring-sage-400/15",
    soft: "group-hover:ring-soft-400/15",
  }[accent];

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-3xl border border-warm-300/55 bg-white/70 p-6",
        "shadow-soft backdrop-blur-sm transition-all duration-300",
        "hover:border-warm-400/60 hover:bg-white/85 hover:shadow-soft-lg",
        "hover:-translate-y-0.5",
        "ring-1 ring-transparent",
        accentRing,
      ].join(" ")}
    >
      {/* Soft accent glow */}
      <div
        className={[
          "absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br",
          accentOrb,
          "opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
        ].join(" ")}
      />

      {/* Subtle inner highlight */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
      </div>

      <div className="relative">
        {/* Icon */}
        <div
          className={[
            "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
            "bg-white/70 ring-1 ring-warm-300/50 backdrop-blur-sm",
            "transition-transform duration-300 group-hover:scale-[1.05]",
          ].join(" ")}
        >
          {icon}
        </div>

        {/* Content */}
        <h3 className="mt-5 text-lg font-semibold text-warm-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

        {/* Decorative line */}
        <div className="mt-5 h-px w-full bg-gradient-to-r from-warm-300/60 via-warm-200/25 to-transparent" />
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
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
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
