import Link from "next/link";
import Image from "next/image";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#D6DED9] bg-[#EEF3EF]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="group inline-flex items-center">
          <Image
            src="/logo.png"
            alt="Psicanálise"
            width={160}
            height={40}
            priority
            className="h-9 w-auto group-hover:opacity-80"
          />
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-md bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
