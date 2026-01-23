import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#D6DED9] bg-transparent">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-black/5 blur-3xl" />
        <div className="absolute -bottom-24 right-[-120px] h-72 w-72 rounded-full bg-black/5 blur-3xl" />
        <div className="absolute -bottom-40 left-[-120px] h-72 w-72 rounded-full bg-black/5 blur-3xl" />

        {/* subtle green tint */}
        <div className="absolute left-1/2 top-10 h-64 w-[680px] -translate-x-1/2 rounded-full bg-[#2F6F4E]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="py-14 sm:py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D6DED9] bg-white/50 px-3 py-1.5 text-xs text-[#5F6B64] backdrop-blur">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#2F6F4E]" />
            Atendimento psicanalítico online • ética • sigilo
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl md:text-6xl">
            Um espaço seguro para falar,
            <span className="block text-[#36413A]">sentir e se escutar.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#5F6B64] sm:text-base">
            A psicanálise não é sobre “consertar” você. É sobre criar um lugar
            de escuta onde aquilo que pesa ganha nome, sentido e caminho. Com
            cuidado, tempo e presença clínica.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/cadastro"
              className="inline-flex w-full items-center justify-center rounded-md bg-[#111111] px-5 py-3 text-sm font-medium text-white hover:opacity-90 sm:w-auto"
            >
              Começar agora
            </Link>

            <Link
              href="#como-funciona"
              className="inline-flex w-full items-center justify-center rounded-md border border-[#D6DED9] bg-white/60 px-5 py-3 text-sm font-medium text-[#111111] hover:bg-white/80 backdrop-blur sm:w-auto"
            >
              Entender como funciona
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Card
              title="Psicanálise"
              desc="Escuta clínica e elaboração emocional, com profundidade e cuidado."
            />
            <Card
              title="Organização"
              desc="Agendamento simples, tudo no seu tempo, sem ruído e sem correria."
            />
            <Card
              title="Sigilo"
              desc="Confidencialidade e ética como base, do início ao fim."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group rounded-xl border border-[#D6DED9] bg-white/70 p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <p className="text-sm font-semibold text-[#111111]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#5F6B64]">{desc}</p>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-[#D6DED9] via-white/60 to-transparent" />
    </div>
  );
}
