import Link from "next/link";
import { Section } from "./Section";

export function Contato() {
  return (
    <Section
      id="contato"
      eyebrow="Contato"
      title="Se você quiser, a gente começa com calma."
      subtitle="Dúvidas são normais. Você pode falar com a gente e entender o processo antes de agendar."
    >
      {/* Contact cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        <ContactCard
          icon={<MailIcon />}
          title="Email"
          value="contato@raizaconvento.com.br"
          hint="Resposta em até 24h"
          gradient="from-rose-400/15 to-warm-500/10"
        />
        <ContactCard
          icon={<PhoneIcon />}
          title="WhatsApp"
          value="(11) 91329-9115"
          hint="Seg a Sex • 9h às 18h"
          gradient="from-sage-400/15 to-sage-500/10"
        />
      </div>

      {/* CTA Banner */}
      <div className="mt-10 overflow-hidden rounded-4xl bg-gradient-to-br from-warm-900 via-warm-800 to-warm-900 shadow-soft-xl">
        {/* Decorative elements */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-400/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-soft-400/10 blur-3xl" />
            <div className="absolute right-1/4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-warm-500/10 blur-2xl" />
          </div>

          <div className="relative px-6 py-12 sm:px-10 sm:py-16">
            {/* Badge */}
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-warm-400">
              <span className="h-px w-6 bg-warm-500" />
              Comece hoje
            </p>

            {/* Heading */}
            <h3 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-warm-50 sm:text-3xl md:text-4xl">
              Um encontro com a sua história pode mudar a forma como você vive o{" "}
              <span className="text-rose-300">agora</span>.
            </h3>

            {/* Description */}
            <p className="mt-5 max-w-xl text-base leading-relaxed text-warm-300/90">
              Se fizer sentido para você, crie sua conta e escolha um horário. A
              psicanálise começa quando você pode falar com verdade, no seu
              tempo.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cadastro"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-medium text-warm-900 shadow-soft transition-all duration-400 hover:bg-warm-50 hover:shadow-soft-lg sm:w-auto"
              >
                Criar conta
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
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-warm-50/20 bg-warm-50/5 px-7 py-4 text-base font-medium text-warm-50 backdrop-blur-sm transition-all duration-400 hover:border-warm-50/30 hover:bg-warm-50/10 sm:w-auto"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-warm-400">
              <span className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                Sigilo garantido
              </span>
              <span className="flex items-center gap-2">
                <LockIcon className="h-4 w-4" />
                Dados protegidos
              </span>
              <span className="flex items-center gap-2">
                <HeartIcon className="h-4 w-4" />
                Atendimento humanizado
              </span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ContactCard({
  icon,
  title,
  value,
  hint,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-400 hover:border-warm-400/60 hover:bg-white hover:shadow-soft-lg">
      {/* Background gradient */}
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-50 blur-2xl transition-opacity duration-400 group-hover:opacity-80`}
      />

      <div className="relative">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} ring-1 ring-warm-300/30`}
          >
            {icon}
          </div>
          <div>
            <p className="font-semibold text-warm-900">{title}</p>
            <p className="mt-1 text-base text-warm-800">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function MailIcon() {
  return (
    <svg
      className="h-5 w-5 text-rose-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="h-5 w-5 text-sage-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
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
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}
