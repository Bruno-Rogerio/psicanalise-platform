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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <p className="text-sm font-semibold text-zinc-900">Email</p>
          <p className="mt-2 text-sm text-zinc-700">contato@seusite.com.br</p>
          <p className="mt-1 text-xs text-zinc-500">
            (Depois você edita no admin)
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <p className="text-sm font-semibold text-zinc-900">WhatsApp</p>
          <p className="mt-2 text-sm text-zinc-700">(11) 99999-9999</p>
          <p className="mt-1 text-xs text-zinc-500">
            (Depois você edita no admin)
          </p>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-[#111111]">
        <div className="px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Comece hoje
          </p>
          <h3 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Um encontro com a sua história pode mudar a forma como você vive o
            agora.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-200 sm:text-base">
            Se fizer sentido para você, crie sua conta e escolha um horário. A
            psicanálise começa quando você pode falar com verdade, no seu tempo.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-medium text-zinc-950 hover:opacity-90 sm:w-auto"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent px-5 py-3 text-sm font-medium text-white hover:bg-white/10 sm:w-auto"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
