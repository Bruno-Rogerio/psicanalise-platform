"use client";

import Image from "next/image";

export function Sobre() {
  return (
    <section
      id="sobre"
      className="relative overflow-hidden bg-gradient-to-b from-warm-100 via-warm-100 to-white py-10 sm:py-12 md:py-14"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* FOTO */}
          <div className="relative mx-auto w-full max-w-sm md:max-w-md">
            <div className="absolute -inset-6 rounded-4xl bg-gradient-to-br from-rose-200/40 via-transparent to-soft-200/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-4xl border border-warm-300/40 bg-white shadow-soft-lg">
              <Image
                src="/raizaconvento.jpeg" // 👈 coloque sua foto na pasta /public
                alt="Psicanalista Raiza Convento"
                width={600}
                height={750}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>

          {/* TEXTO */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-warm-500">
              Sobre mim
            </p>

            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-warm-900 sm:text-4xl">
              Um espaço de escuta começa com presença.
            </h2>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-warm-800/90">
              <p>
                Meu nome é <strong>Raiza Convento</strong> e minha trajetória na
                psicanálise nasceu do desejo profundo de compreender as
                histórias que carregamos por dentro. Aquelas que, muitas vezes,
                não encontram palavras, mas ainda assim pedem para serem
                ouvidas.
              </p>

              <p>
                Acredito que cada pessoa tem seu tempo, sua forma de sentir e
                seu próprio caminho de elaboração. Meu trabalho é oferecer um
                espaço seguro, ético e acolhedor para que você possa falar do
                que dói, do que confunde e também do que deseja transformar.
              </p>

              <p>
                Aqui, a escuta é sem pressa, sem julgamentos e com respeito à
                sua história. Porque cuidar daquilo que é invisível também é uma
                forma profunda de cuidado.
              </p>
            </div>

            {/* Assinatura */}
            <div className="mt-8">
              <p className="font-semibold text-warm-900">Raiza Convento</p>
              <p className="text-sm text-warm-600">Psicanalista</p>
            </div>
          </div>
        </div>
      </div>

      {/* fade inferior suave */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
