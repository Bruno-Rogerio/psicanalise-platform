import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#D6DED9] bg-[#EEF3EF]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-tight text-zinc-900">
              Plataforma de Psicanálise
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
              Um espaço de escuta, cuidado e sigilo. Atendimento psicanalítico
              online com organização e responsabilidade clínica.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-medium text-zinc-900">Navegação</p>
              <div className="flex flex-col gap-2 text-[#6F6F6F]">
                <Link className="hover:text-zinc-900" href="/#como-funciona">
                  Como funciona
                </Link>
                <Link className="hover:text-zinc-900" href="/#avaliacoes">
                  Avaliações
                </Link>
                <Link className="hover:text-zinc-900" href="/#contato">
                  Contato
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-zinc-900">Acesso</p>
              <div className="flex flex-col gap-2 text-[#6F6F6F]">
                <Link className="hover:text-zinc-900" href="/login">
                  Entrar
                </Link>
                <Link className="hover:text-zinc-900" href="/cadastro">
                  Criar conta
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-zinc-900">Legal</p>
              <div className="flex flex-col gap-2 text-[#6F6F6F]">
                <span className="text-zinc-500">Política de privacidade</span>
                <span className="text-zinc-500">Termos de uso</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200/70 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Plataforma de Psicanálise.</span>
          <span>Feito com cuidado • Mobile first</span>
        </div>
      </div>
    </footer>
  );
}
