"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const sp = useSearchParams();
  const redirect = sp.get("redirect");

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-warm-900">
        Página não encontrada
      </h1>

      <p className="mt-3 text-warm-600">
        O link que você tentou acessar não existe ou foi removido.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[#4A7C59] px-5 py-3 font-semibold text-white hover:bg-[#3d6649]"
        >
          Ir para o início
        </Link>

        {redirect && (
          <Link
            href={redirect}
            className="text-sm font-semibold text-warm-700 underline underline-offset-4"
          >
            Voltar para onde eu estava
          </Link>
        )}
      </div>
    </div>
  );
}
