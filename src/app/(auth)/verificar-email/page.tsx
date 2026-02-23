import { Suspense } from "react";
import VerificarEmailClient from "./verificar-email-client";

export const dynamic = "force-dynamic";

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-warm-900">
              Verificar email
            </h1>
            <p className="mt-2 text-sm text-muted">Carregando...</p>
          </div>
        </div>
      }
    >
      <VerificarEmailClient />
    </Suspense>
  );
}
