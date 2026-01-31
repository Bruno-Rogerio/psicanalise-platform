import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-100 via-warm-100 to-soft-100/50">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-rose-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-soft-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-warm-300/40 bg-warm-100/60 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="group inline-flex items-center">
            <Image
              src="/logo.png" // ou o nome correto do seu arquivo
              alt="Raiza Convento Psicanálise"
              width={160}
              height={48}
              priority
              className="h-12 w-auto transition-opacity duration-300 group-hover:opacity-80"
            />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-warm-700 transition-all duration-300 hover:bg-warm-200/50 hover:text-warm-900"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar para o início
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 p-8 shadow-soft-lg backdrop-blur-sm sm:p-10">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Seus dados estão protegidos com criptografia e sigilo profissional.
          </p>
        </div>
      </main>
    </div>
  );
}
