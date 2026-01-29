"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase-browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error || !data.user) {
        setLoading(false);
        setErro("Email ou senha inválidos. Verifique e tente novamente.");
        return;
      }

      // Busca role no profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      setLoading(false);

      // Redireciona baseado no role ou para URL salva
      if (
        redirectTo &&
        !redirectTo.startsWith("/login") &&
        !redirectTo.startsWith("/cadastro")
      ) {
        router.push(redirectTo);
      } else if (profile?.role === "profissional") {
        router.push("/profissional/agenda");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (err) {
      setLoading(false);
      setErro("Ocorreu um erro. Tente novamente.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-warm-900">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-sm text-muted">
          Acesse sua conta para agendar ou acompanhar suas sessões.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-warm-900">
            Email
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-warm-300/60 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition-all duration-300 placeholder:text-warm-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            required
            autoComplete="email"
          />
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm font-medium text-warm-900">
            Senha
          </label>
          <div className="relative mt-2">
            <input
              className="w-full rounded-xl border border-warm-300/60 bg-white px-4 py-3 pr-12 text-sm text-warm-900 outline-none transition-all duration-300 placeholder:text-warm-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20"
              type={showPassword ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-400 transition-colors hover:text-warm-600"
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <AlertIcon className="h-4 w-4 shrink-0" />
              {erro}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-500 px-5 py-3.5 text-base font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>

        {/* Links */}
        <div className="flex items-center justify-between pt-2 text-sm">
          <Link
            href="/recuperar"
            className="text-muted transition-colors duration-300 hover:text-warm-700"
          >
            Esqueci minha senha
          </Link>
          <Link
            href="/cadastro"
            className="font-medium text-sage-600 transition-colors duration-300 hover:text-sage-700"
          >
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="text-center">
        <div className="mx-auto h-7 w-48 rounded bg-warm-200" />
        <div className="mx-auto mt-2 h-4 w-64 rounded bg-warm-200" />
      </div>
      <div className="mt-8 space-y-5">
        <div className="h-12 rounded-xl bg-warm-200" />
        <div className="h-12 rounded-xl bg-warm-200" />
        <div className="h-12 rounded-xl bg-warm-200" />
      </div>
    </div>
  );
}

// Icons
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
