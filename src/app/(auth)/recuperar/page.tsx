"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/auth/callback?next=/resetar-senha`;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setMsg("Não foi possível enviar o email agora. Tente novamente.");
      return;
    }

    setMsg(
      "Enviamos um link para seu email. Abra e siga as instruções para redefinir.",
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Recuperar senha</h1>
      <p className="mt-2 text-sm text-[#6F6F6F]">
        Digite seu email e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            required
          />
        </div>

        {msg ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {msg}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-[#111111] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar link"}
        </button>

        <div className="text-sm text-[#6F6F6F]">
          <Link href="/login" className="hover:text-zinc-900">
            Voltar para entrar
          </Link>
        </div>
      </form>
    </div>
  );
}
