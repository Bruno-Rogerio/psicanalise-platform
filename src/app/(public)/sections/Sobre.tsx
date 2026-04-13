"use client";

import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

export function Sobre() {
  return (
    <section id="sobre" className="relative overflow-hidden bg-[#F2EDE8] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-60 -top-20 h-[500px] w-[500px] rounded-full bg-[#E8755A]/6 blur-3xl" />
        <div className="absolute -bottom-20 -left-60 h-[400px] w-[400px] rounded-full bg-[#4A7C59]/6 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">

          {/* Text */}
          <div>
            <Reveal direction="up" delay={0} trackSection="Sobre">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B0A098]">Sobre mim</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#1A1614] sm:text-4xl lg:text-5xl">
                A escuta começa<br />
                <span className="italic text-[#E8755A]">com presença.</span>
              </h2>
            </Reveal>

            <Reveal direction="up" delay={120}>
              <div className="mt-8 space-y-5 text-base leading-relaxed text-[#8B7B72]">
                <p>
                  Meu nome é{" "}
                  <strong className="font-semibold text-[#2C2420]">Raiza Convento</strong> e minha trajetória na psicanálise nasceu do desejo profundo de compreender as histórias que carregamos por dentro. Aquelas que, muitas vezes, não encontram palavras, mas ainda assim pedem para ser ouvidas.
                </p>
                <p>
                  Acredito que cada pessoa tem seu tempo, sua forma de sentir e seu próprio caminho de elaboração. Meu trabalho é oferecer um espaço seguro, ético e acolhedor para que você possa falar do que dói, do que confunde e também do que deseja transformar.
                </p>
              </div>
            </Reveal>

            <Reveal direction="left" delay={220}>
              <blockquote className="mt-10 border-l-2 border-[#E8755A] pl-6">
                <p className="text-lg italic leading-relaxed text-[#4A3F3A]">
                  "Aqui, a escuta é sem pressa, sem julgamentos e com respeito à sua história. Porque cuidar daquilo que é invisível também é uma forma profunda de cuidado."
                </p>
              </blockquote>
            </Reveal>

            <Reveal direction="up" delay={300}>
              <div className="mt-10 flex items-center gap-5">
                <div className="h-px flex-1 bg-[#E8E0DC]" />
                <div className="text-right">
                  <p className="font-bold text-[#1A1614]">Raiza Convento</p>
                  <p className="text-sm text-[#B0A098]">Psicanalista</p>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  { value: "100+", label: "Pacientes atendidos" },
                  { value: "2", label: "Modalidades de atendimento" },
                ].map((stat, i) => (
                  <Reveal key={stat.label} direction="scale" delay={380 + i * 80}>
                    <div className="rounded-2xl border border-[#E8E0DC]/80 bg-white p-5 text-center shadow-sm">
                      <p className="text-2xl font-black text-[#1A1614]">{stat.value}</p>
                      <p className="mt-1 text-xs leading-tight text-[#B0A098]">{stat.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Photo */}
          <Reveal direction="scale" delay={100} className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[3.5rem] bg-gradient-to-br from-[#E8755A]/12 via-transparent to-[#4A7C59]/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2.75rem] shadow-xl ring-1 ring-[#E8E0DC]">
              <Image
                src="/raizaconvento.jpeg"
                alt="Psicanalista Raiza Convento"
                width={480}
                height={600}
                className="h-auto w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#2C2420]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="rounded-xl bg-white/90 px-3 py-2 backdrop-blur-sm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">Psicanalista</p>
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

            <div className="absolute -left-3 top-12 hidden rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 shadow-md sm:-left-6 sm:top-16 sm:block">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#4A7C59] animate-pulse" />
                <p className="text-xs font-semibold text-[#8B7B72]">Atendimentos online</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
