"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    async function handleLogout() {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          setStatus("error");
          return;
        }

        setStatus("success");

        // Aguarda um pouco para mostrar feedback
        setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 1000);
      } catch (err) {
        setStatus("error");
      }
    }

    handleLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-100 via-warm-100 to-soft-100/50">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-rose-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-soft-400/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-warm-200 to-warm-300/50">
                <LoadingSpinner className="h-8 w-8 text-warm-600" />
              </div>
              <p className="text-base text-warm-700">Saindo da sua conta...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sage-400/20 to-sage-500/20">
                <CheckIcon className="h-8 w-8 text-sage-600" />
              </div>
              <p className="text-base text-warm-700">Você saiu com sucesso!</p>
              <p className="mt-1 text-sm text-muted">Redirecionando...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-400/20 to-rose-500/20">
                <AlertIcon className="h-8 w-8 text-rose-600" />
              </div>
              <p className="text-base text-warm-700">Erro ao sair</p>
              <button
                onClick={() => (window.location.href = "/")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sage-500 px-5 py-2.5 text-sm font-medium text-warm-50 transition-all duration-300 hover:bg-sage-600"
              >
                Ir para o início
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
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
