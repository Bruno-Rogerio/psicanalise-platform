import Link from "next/link";
import Image from "next/image";

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#E8E0DC]/60 bg-[#F2EDE8]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="group inline-flex items-center">
              <Image
                src="/logo.jpeg"
                alt="Psicanálise"
                width={140}
                height={40}
                className="h-16 w-auto transition-opacity duration-300 group-hover:opacity-80"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#8B7B72]">
              Um lugar para falar do que dói e olhar para isso com cuidado.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 sm:gap-12">
            <div className="space-y-3">
              <p className="font-bold text-[#1A1614]">Navegação</p>
              <div className="flex flex-col gap-2.5 text-[#8B7B72]">
                <Link className="transition-colors duration-300 hover:text-[#1A1614]" href="/#como-funciona">
                  Como funciona
                </Link>
                <Link className="transition-colors duration-300 hover:text-[#1A1614]" href="/#avaliacoes">
                  Avaliações
                </Link>
                <Link className="transition-colors duration-300 hover:text-[#1A1614]" href="/#contato">
                  Contato
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-[#1A1614]">Acesso</p>
              <div className="flex flex-col gap-2.5 text-[#8B7B72]">
                <Link className="transition-colors duration-300 hover:text-[#1A1614]" href="/login">
                  Entrar
                </Link>
                <Link className="transition-colors duration-300 hover:text-[#1A1614]" href="/cadastro">
                  Criar conta
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-[#1A1614]">Legal</p>
              <div className="flex flex-col gap-2.5 text-[#8B7B72]">
                <Link href="/politica-de-privacidade" className="transition-colors duration-300 hover:text-[#1A1614]">
                  Política de privacidade
                </Link>
                <Link href="/termos-de-uso" className="transition-colors duration-300 hover:text-[#1A1614]">
                  Termos de uso
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-3 border-t border-[#E8E0DC]/60 pt-8 text-xs text-[#B0A098] sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Raiza Convento - Psicanalista. Todos os direitos reservados.
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#4A7C59]" />
            Feito com cuidado e acolhimento
          </span>
        </div>
      </div>
    </footer>
  );
}
