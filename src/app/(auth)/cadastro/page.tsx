"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, phone }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoading(false);
        setMsg({
          type: "error",
          text:
            data?.error ||
            "NÃ£o foi possÃ­vel criar sua conta. Verifique os dados e tente novamente.",
        });
        return;
      }

      setLoading(false);
      setMsg({
        type: "success",
        text: data?.emailSent
          ? "Conta criada com sucesso! Verifique seu email para confirmar o cadastro."
          : "Conta criada! NÃ£o conseguimos enviar o email agora. Tente reenviar a verificaÃ§Ã£o.",
      });

      // Aguarda um pouco antes de redirecionar
      setTimeout(() => {
        router.push(`/verificar-email?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setLoading(false);
      setMsg({ type: "error", text: "Ocorreu um erro. Tente novamente." });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-warm-900">
          Criar sua conta
        </h1>
        <p className="mt-2 text-sm text-muted">
          Um primeiro passo simples. A psicanÃ¡lise acontece no seu tempo.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-warm-900">
            Nome
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-warm-300/60 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition-all duration-300 placeholder:text-warm-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como vocÃª gostaria de ser chamado(a)?"
            required
            autoComplete="name"
          />
        </div>

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

        {/* Telefone (opcional) */}
        <div>
          <label className="block text-sm font-medium text-warm-900">
            Telefone (opcional)
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-warm-300/60 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition-all duration-300 placeholder:text-warm-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            autoComplete="tel"
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
              placeholder="MÃ­nimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
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
          <p className="mt-1.5 text-xs text-muted">
            Use pelo menos 6 caracteres
          </p>
        </div>

        {/* Mensagem */}
        {msg && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              msg.type === "success"
                ? "border-sage-200 bg-sage-50 text-sage-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {msg.type === "success" ? (
                <CheckIcon className="h-4 w-4 shrink-0" />
              ) : (
                <AlertIcon className="h-4 w-4 shrink-0" />
              )}
              {msg.text}
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
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </button>

        {/* Link para login */}
        <p className="pt-2 text-center text-sm text-muted">
          JÃ¡ tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-sage-600 transition-colors duration-300 hover:text-sage-700"
          >
            Entrar
          </Link>
        </p>
      </form>
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

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
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

