"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/auth/callback?next=/resetar-senha`;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      setLoading(false);

      if (error) {
        setMsg({
          type: "error",
          text: "Não foi possível enviar o email. Verifique o endereço e tente novamente.",
        });
        return;
      }

      setMsg({
        type: "success",
        text: "Enviamos um link para seu email. Verifique sua caixa de entrada e siga as instruções.",
      });
    } catch (err) {
      setLoading(false);
      setMsg({ type: "error", text: "Ocorreu um erro. Tente novamente." });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-400/20 to-warm-500/20">
          <KeyIcon className="h-7 w-7 text-warm-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-warm-900">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-muted">
          Digite seu email e enviaremos um link para você criar uma nova senha.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-warm-900">
            Email cadastrado
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

        {/* Mensagem */}
        {msg && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              msg.type === "success"
                ? "border-sage-200 bg-sage-50 text-sage-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            <div className="flex items-start gap-2">
              {msg.type === "success" ? (
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
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
              Enviando...
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </button>

        {/* Link para voltar */}
        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors duration-300 hover:text-warm-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      </form>
    </div>
  );
}

// Icons
function KeyIcon({ className }: { className?: string }) {
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
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
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
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
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
