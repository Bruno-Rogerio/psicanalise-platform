"use client";

import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F2EDE8]">
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.06); }
          66% { transform: translate(-20px, 45px) scale(0.96); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-55px, 28px) scale(1.04); }
          66% { transform: translate(35px, -38px) scale(0.97); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-48 -top-24 h-[700px] w-[700px] rounded-full opacity-50"
          style={{
            background: "radial-gradient(circle, #E8755A18 0%, transparent 70%)",
            animation: "floatOrb1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 -right-48 h-[600px] w-[600px] rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, #4A7C5918 0%, transparent 70%)",
            animation: "floatOrb2 26s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, #D4A72C10 0%, transparent 70%)",
            animation: "floatOrb1 32s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid min-h-[88vh] items-center gap-10 pb-8 pt-6 lg:grid-cols-[1fr_440px] lg:gap-16 lg:py-0 xl:grid-cols-[1fr_520px]">

          {/* ===== LEFT — Text ===== */}
          <div className="relative z-10 py-10 lg:py-24">

            {/* Badge */}
            <div
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#DDD5CE] bg-white/80 px-4 py-2 text-sm font-medium text-[#8B7B72] shadow-sm backdrop-blur-sm"
              style={{ animation: "fadeUp 0.5s ease-out 0.1s both" }}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A7C59] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4A7C59]" />
              </span>
              O que você sente faz sentido. Vamos olhar para isso com cuidado.
            </div>

            {/* Headline — 3 lines with different weights */}
            <h1 className="max-w-2xl space-y-1">
              <span
                className="block text-5xl font-extralight leading-[1.08] tracking-tight text-[#1A1614] sm:text-6xl lg:text-[5.5rem]"
                style={{ animation: "fadeUp 0.6s ease-out 0.2s both" }}
              >
                Um espaço para
              </span>
              <span
                className="block text-5xl font-black italic leading-[1.08] tracking-tight text-[#E8755A] sm:text-6xl lg:text-[5.5rem]"
                style={{ animation: "fadeUp 0.6s ease-out 0.32s both" }}
              >
                falar do que sente
              </span>
              <span
                className="block text-5xl font-extralight leading-[1.08] tracking-tight text-[#1A1614] sm:text-6xl lg:text-[5.5rem]"
                style={{ animation: "fadeUp 0.6s ease-out 0.44s both" }}
              >
                com cuidado.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="mt-8 max-w-lg text-lg leading-relaxed text-[#8B7B72] sm:text-xl"
              style={{ animation: "fadeUp 0.6s ease-out 0.54s both" }}
            >
              A psicanálise não é sobre consertar você. É sobre criar um lugar de escuta onde aquilo que pesa ganha nome, sentido e caminho.
            </p>

            {/* CTA Buttons */}
            <div
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              style={{ animation: "fadeUp 0.6s ease-out 0.64s both" }}
            >
              <Link
                href="/cadastro"
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1A1614] px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2C2420] hover:shadow-2xl active:scale-[0.99] sm:w-auto"
              >
                Começar agora
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <Link
                href="#como-funciona"
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#E8E0DC] bg-white/70 px-8 py-4 text-base font-semibold text-[#1A1614] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1A1614]/20 hover:bg-white sm:w-auto"
              >
                Como funciona
              </Link>
            </div>

            {/* Trust row */}
            <div
              className="mt-10 flex flex-wrap items-center gap-6 text-sm text-[#B0A098]"
              style={{ animation: "fadeUp 0.6s ease-out 0.74s both" }}
            >
              {["Sigilo garantido", "Cancelamento gratuito", "Sem julgamentos"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span className="text-[#4A7C59] font-bold">✓</span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* ===== RIGHT — Photo ===== */}
          <div
            className="relative hidden lg:block"
            style={{ animation: "scaleIn 0.9s ease-out 0.4s both" }}
          >
            {/* Decorative rings */}
            <div className="absolute -inset-4 rounded-[3.5rem] bg-gradient-to-br from-[#E8755A]/15 via-transparent to-[#4A7C59]/15 blur-2xl" />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#E8755A]/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#4A7C59]/15 blur-3xl" />

            {/* Photo container */}
            <div className="relative overflow-hidden rounded-[3rem] shadow-2xl">
              <Image
                src="/raizaconvento.jpeg"
                alt="Raiza Convento — Psicanalista"
                width={520}
                height={660}
                className="h-auto w-full object-cover"
                priority
              />
              {/* Gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-[#1A1614]/70 to-transparent" />

              {/* Floating quote card */}
              <div className="absolute bottom-6 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-sm">
                <p className="text-sm italic leading-relaxed text-[#2C2420]">
                  "Cada história merece ser ouvida com cuidado e sem pressa."
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-[#E8E0DC]" />
                  <p className="text-xs font-bold text-[#4A7C59]">Raiza Convento</p>
                </div>
              </div>
            </div>

            {/* Floating accent badge */}
            <div className="absolute -right-4 top-16 rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 shadow-lg">
              <p className="text-xs font-bold text-[#1A1614] uppercase tracking-wider">Psicanalista</p>
              <div className="mt-1 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-3 w-3 text-[#D4A72C]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Marquee Strip ===== */}
      <div className="relative overflow-hidden border-y border-[#2C2420]/20 bg-[#1A1614] py-4">
        <div
          className="flex whitespace-nowrap"
          style={{ animation: "marqueeScroll 22s linear infinite" }}
        >
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 pr-8 text-sm font-medium text-white/30">
              <span className="text-[#E8755A]">✦</span>Psicanálise
              <span className="text-[#E8755A]">✦</span>Escuta Clínica
              <span className="text-[#E8755A]">✦</span>Acolhimento
              <span className="text-[#E8755A]">✦</span>Autoconhecimento
              <span className="text-[#E8755A]">✦</span>Presença
              <span className="text-[#E8755A]">✦</span>Cuidado
              <span className="text-[#E8755A]">✦</span>Análise
              <span className="text-[#E8755A]">✦</span>Sigilo&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
