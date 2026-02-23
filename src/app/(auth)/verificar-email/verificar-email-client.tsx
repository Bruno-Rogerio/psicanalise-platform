"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerificarEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error" | "resending" | "resent"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const hasToken = useMemo(() => !!token, [token]);

  useEffect(() => {
    if (!token) return;

    (async () => {
      setStatus("verifying");
      setMessage(null);

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Email verificado com sucesso.");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(data?.error || "Nao foi possivel verificar o email.");
      }
    })();
  }, [token]);

  async function resend() {
    if (!email.trim()) {
      setMessage("Informe seu email.");
      setStatus("error");
      return;
    }

    setStatus("resending");
    setMessage(null);

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setStatus("resent");
      setMessage("Se o email existir, enviamos um novo link.");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(data?.error || "Nao foi possivel reenviar.");
    }
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-warm-900">
          Verificar email
        </h1>
        <p className="mt-2 text-sm text-muted">
          Confirme seu email para ativar a conta.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {hasToken ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === "success"
                ? "border-sage-200 bg-sage-50 text-sage-700"
                : status === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-warm-200 bg-warm-50 text-warm-700"
            }`}
          >
            {status === "verifying" ? "Verificando..." : message}
          </div>
        ) : (
          <div className="space-y-4">
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

            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  status === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-sage-200 bg-sage-50 text-sage-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              onClick={resend}
              disabled={status === "resending"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-500 px-5 py-3.5 text-base font-medium text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-600 hover:shadow-soft-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "resending" ? "Enviando..." : "Reenviar verificacao"}
            </button>
          </div>
        )}

        <div className="pt-2 text-center text-sm text-muted">
          <Link
            href="/login"
            className="font-medium text-sage-600 transition-colors duration-300 hover:text-sage-700"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
