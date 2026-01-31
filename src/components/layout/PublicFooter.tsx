import Link from "next/link";
import Image from "next/image";

export default function PublicFooter() {
  return (
    <footer className="border-t border-warm-300/60 bg-warm-100">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="group inline-flex items-center">
              <Image
                src="/logo.png"
                alt="Psicanálise"
                width={140}
                height={40}
                className="h-14 w-auto transition-opacity duration-300 group-hover:opacity-90"
              />
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Um lugar para falar do que dói e olhar para isso com cuidado.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 sm:gap-12">
            <div className="space-y-3">
              <p className="font-semibold text-warm-900">Navegação</p>
              <div className="flex flex-col gap-2.5 text-muted">
                <Link
                  className="transition-colors duration-300 hover:text-warm-500"
                  href="/#como-funciona"
                >
                  Como funciona
                </Link>
                <Link
                  className="transition-colors duration-300 hover:text-warm-500"
                  href="/#avaliacoes"
                >
                  Avaliações
                </Link>
                <Link
                  className="transition-colors duration-300 hover:text-warm-500"
                  href="/#contato"
                >
                  Contato
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-warm-900">Acesso</p>
              <div className="flex flex-col gap-2.5 text-muted">
                <Link
                  className="transition-colors duration-300 hover:text-warm-500"
                  href="/login"
                >
                  Entrar
                </Link>
                <Link
                  className="transition-colors duration-300 hover:text-warm-500"
                  href="/cadastro"
                >
                  Criar conta
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-warm-900">Legal</p>
              <div className="flex flex-col gap-2.5 text-muted">
                <span className="cursor-default">Política de privacidade</span>
                <span className="cursor-default">Termos de uso</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-3 border-t border-warm-300/40 pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Psicanálise Online. Todos os direitos
            reservados.
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
            Feito com cuidado e acolhimento
          </span>
        </div>
      </div>
    </footer>
  );
}
