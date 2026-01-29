import Link from "next/link";
import Image from "next/image";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-warm-300/60 bg-warm-100/80 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="group inline-flex items-center">
          <Image
            src="/logo.png"
            alt="Psicanálise"
            width={160}
            height={40}
            priority
            className="h-20 w-auto transition-opacity duration-300 group-hover:opacity-80"
          />
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-warm-900/80 transition-all duration-300 hover:bg-warm-300/30 hover:text-warm-900"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-xl bg-sage-500 px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
