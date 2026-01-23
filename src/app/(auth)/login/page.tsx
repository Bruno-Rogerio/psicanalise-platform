"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error || !data.user) {
      setLoading(false);
      setErro("Email ou senha inválidos. Tente novamente.");
      return;
    }

    // busca role no profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    if (profile?.role === "profissional") {
      router.push("/profissional/agenda");
    } else {
      router.push("/dashboard");
    }

    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
      <p className="mt-2 text-sm text-[#6F6F6F]">
        Acesse sua conta para agendar ou acompanhar suas sessões.
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

        <div>
          <label className="text-sm font-medium">Senha</label>
          <input
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
            required
          />
        </div>

        {erro ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {erro}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-[#111111] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="flex items-center justify-between text-sm text-[#6F6F6F]">
          <Link href="/recuperar" className="hover:text-zinc-900">
            Esqueci minha senha
          </Link>
          <Link href="/cadastro" className="hover:text-zinc-900">
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  );
}
