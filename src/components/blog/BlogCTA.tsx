import Link from 'next/link';

export function BlogCTA() {
  return (
    <section className="mt-16 rounded-3xl bg-gradient-to-r from-sage-50 to-soft-50 p-8 sm:p-10">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="text-2xl font-semibold text-warm-900">
          Esse conteúdo ressoou com você?
        </h3>

        <p className="mt-4 text-base leading-relaxed text-warm-700">
          Se você sentiu que algo neste texto fala sobre a sua experiência,
          saiba que não precisa passar por isso sozinho(a). A psicanálise pode
          ser um espaço seguro para explorar seus sentimentos e encontrar novos
          caminhos.
        </p>

        <Link
          href="/agenda"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-sage-600 px-8 py-4 text-base font-semibold text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-700 hover:shadow-soft-lg active:scale-[0.99]"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Quero agendar uma sessão
        </Link>

        <p className="mt-4 text-sm text-warm-500">
          Primeira consulta de acolhimento • Ambiente seguro e sigiloso
        </p>
      </div>
    </section>
  );
}
