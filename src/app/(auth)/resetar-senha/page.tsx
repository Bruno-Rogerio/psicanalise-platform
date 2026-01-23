"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function ResetarSenhaPage() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: senha });

    setLoading(false);

    if (error) {
      setMsg("Não foi possível atualizar sua senha. Tente novamente.");
      return;
    }

    setMsg("Senha atualizada com sucesso.");
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Redefinir senha</h1>
      <p className="mt-2 text-sm text-[#6F6F6F]">
        Crie uma nova senha para continuar com segurança.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-sm font-medium">Nova senha</label>
          <input
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha"
            required
            minLength={6}
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
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
