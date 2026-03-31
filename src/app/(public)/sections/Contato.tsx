import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function Contato() {
  return (
    <section id="contato" className="relative overflow-hidden bg-[#FDFAF7] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-20 h-96 w-96 rounded-full bg-[#E8755A]/6 blur-3xl" />
        <div className="absolute -bottom-20 -left-40 h-80 w-80 rounded-full bg-[#4A7C59]/6 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6">

        {/* Header */}
        <Reveal direction="up" delay={0} className="mb-14 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B0A098]">Contato</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#1A1614] sm:text-5xl">
            Se quiser, a gente{" "}
            <span className="italic text-[#E8755A]">começa com calma.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#8B7B72]">
            Dúvidas são normais. Você pode entrar em contato e entender o processo antes de agendar.
          </p>
        </Reveal>

        {/* Contact cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Reveal direction="left" delay={0}>
            <div className="group relative overflow-hidden rounded-3xl border border-[#E8E0DC]/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#E8755A]/8 blur-2xl" />
              <div className="relative flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8755A]/10">
                  <MailIcon className="h-5 w-5 text-[#E8755A]" />
                </div>
                <div>
                  <p className="font-bold text-[#1A1614]">Email</p>
                  <p className="mt-1 text-base text-[#4A3F3A]">contato@raizaconvento.com.br</p>
                  <p className="mt-1 text-xs text-[#B0A098]">Resposta em até 24h</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={80}>
            <div className="group relative overflow-hidden rounded-3xl border border-[#E8E0DC]/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#4A7C59]/8 blur-2xl" />
              <div className="relative flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#4A7C59]/10">
                  <WhatsAppIcon className="h-5 w-5 text-[#4A7C59]" />
                </div>
                <div>
                  <p className="font-bold text-[#1A1614]">WhatsApp</p>
                  <p className="mt-1 text-base text-[#4A3F3A]">(11) 91329-9115</p>
                  <p className="mt-1 text-xs text-[#B0A098]">Seg a Sex • 9h às 18h</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* CTA Banner */}
        <Reveal direction="up" delay={100}>
          <div className="relative mt-10 overflow-hidden rounded-3xl bg-[#2C2420] shadow-xl">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#E8755A]/12 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#4A7C59]/10 blur-3xl" />
            </div>

            <div className="relative px-8 py-12 sm:px-12 sm:py-16">
              <p className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.3em] text-[#E8755A]">
                <span className="h-px w-6 bg-[#E8755A]" />
                Comece hoje
              </p>

              <h3 className="mt-5 max-w-2xl text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
                Um encontro com a sua história pode mudar{" "}
                <span className="italic text-[#E8755A]">a forma como você vive o agora.</span>
              </h3>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/45">
                Se fizer sentido para você, crie sua conta e escolha um horário.
                A psicanálise começa quando você pode falar com verdade, no seu tempo.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/cadastro"
                  className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#1A1614] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F2EDE8] hover:shadow-xl sm:w-auto"
                >
                  Criar conta
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white/80 transition-all duration-300 hover:border-white/25 hover:bg-white/10 sm:w-auto"
                >
                  Já tenho conta
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-white/30">
                {[
                  { icon: <ShieldCheckIcon className="h-4 w-4" />, label: "Sigilo garantido" },
                  { icon: <LockIcon className="h-4 w-4" />, label: "Dados protegidos" },
                  { icon: <HeartIcon className="h-4 w-4" />, label: "Atendimento humanizado" },
                ].map(({ icon, label }) => (
                  <span key={label} className="flex items-center gap-2">{icon}{label}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
