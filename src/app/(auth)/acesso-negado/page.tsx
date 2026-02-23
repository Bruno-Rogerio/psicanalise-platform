"use client";

import { useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

export default function AcessoNegadoPage() {
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-warm-900">
        Acesso negado
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sua conta esta bloqueada. Se isso for um engano, entre em contato.
      </p>

      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-sage-500 px-5 py-3.5 text-base font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600"
        >
          Voltar para o inicio
        </Link>
      </div>
    </div>
  );
}
