"use client";

import Image from "next/image";

export function Sobre() {
  return (
    <section id="sobre" className="relative overflow-hidden bg-[#1A1614] py-20 sm:py-28">
      {/* Background decorative orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-60 -top-20 h-[500px] w-[500px] rounded-full bg-[#E8755A]/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-60 h-[400px] w-[400px] rounded-full bg-[#4A7C59]/5 blur-3xl" />
        <div className="absolute right-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#D4A72C]/3 blur-3xl" />
      </div>

      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid items-center gap-16 md:grid-cols-2 md:gap-20">

          {/* ===== Text ===== */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E8755A]">
              Sobre mim
            </p>

            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              A escuta começa<br />
              <span className="italic text-[#E8755A]">com presença.</span>
            </h2>

            <div className="mt-8 space-y-5 text-base leading-relaxed text-white/55">
              <p>
                Meu nome é{" "}
                <strong className="font-semibold text-white">Raiza Convento</strong> e minha trajetória na psicanálise nasceu do desejo profundo de compreender as histórias que carregamos por dentro. Aquelas que, muitas vezes, não encontram palavras, mas ainda assim pedem para serem ouvidas.
              </p>
              <p>
                Acredito que cada pessoa tem seu tempo, sua forma de sentir e seu próprio caminho de elaboração. Meu trabalho é oferecer um espaço seguro, ético e acolhedor para que você possa falar do que dói, do que confunde e também do que deseja transformar.
              </p>
            </div>

            {/* Pull quote */}
            <blockquote className="mt-10 border-l-2 border-[#E8755A] pl-6">
              <p className="text-lg italic leading-relaxed text-white/80">
                "Aqui, a escuta é sem pressa, sem julgamentos e com respeito à sua história. Porque cuidar daquilo que é invisível também é uma forma profunda de cuidado."
              </p>
            </blockquote>

            {/* Signature */}
            <div className="mt-10 flex items-center gap-5">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-right">
                <p className="font-bold text-white">Raiza Convento</p>
                <p className="text-sm text-[#8B7B72]">Psicanalista</p>
              </div>
            </div>

            {/* Mini stats */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { value: "100+", label: "Pacientes atendidos" },
                { value: "5+", label: "Anos de experiência" },
                { value: "2", label: "Modalidades" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/40 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Photo ===== */}
          <div className="relative mx-auto w-full max-w-md">
            {/* Decorative frame glow */}
            <div className="absolute -inset-4 rounded-[3.5rem] bg-gradient-to-br from-[#E8755A]/20 via-transparent to-[#4A7C59]/15 blur-2xl" />

            {/* Photo */}
            <div className="relative overflow-hidden rounded-[2.75rem] shadow-2xl ring-1 ring-white/5">
              <Image
                src="/raizaconvento.jpeg"
                alt="Psicanalista Raiza Convento"
                width={480}
                height={600}
                className="h-auto w-full object-cover"
              />
              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#1A1614]/80 to-transparent" />
              {/* Bottom tag */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Psicanalista</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-[#D4A72C]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating accent */}
            <div className="absolute -left-6 top-16 rounded-2xl border border-white/10 bg-[#1A1614]/90 px-4 py-3 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#4A7C59] animate-pulse" />
                <p className="text-xs font-semibold text-white/60">Atendimentos online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
