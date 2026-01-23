"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/auth/callback?next=/profissional/agenda`;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: redirectTo, // se confirmação por email estiver ativa
        data: { nome },
      },
    });

    if (error) {
      setLoading(false);
      setMsg(
        "Não foi possível criar sua conta. Verifique os dados e tente novamente.",
      );
      return;
    }

    // Se já tiver sessão imediatamente (dependendo da config), cria profile.
    // Se for confirmação por email, isso roda quando o usuário voltar via callback.
    if (data.user) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          nome,
          role: "cliente",
        },
        { onConflict: "id" },
      );
    }

    setLoading(false);

    setMsg(
      "Conta criada. Se sua confirmação por email estiver ativa, verifique sua caixa de entrada para concluir.",
    );
    router.push("/login");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Criar conta</h1>
      <p className="mt-2 text-sm text-[#6F6F6F]">
        Um primeiro passo simples. A psicanálise acontece no seu tempo.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-sm font-medium">Nome</label>
          <input
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            required
          />
        </div>

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

        <div>
          <label className="text-sm font-medium">Senha</label>
          <input
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Crie uma senha"
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
          {loading ? "Criando..." : "Criar conta"}
        </button>

        <div className="text-sm text-[#6F6F6F]">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 hover:opacity-80"
          >
            Entrar
          </Link>
        </div>
      </form>
    </div>
  );
}
