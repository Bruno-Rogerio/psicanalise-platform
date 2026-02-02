import { Suspense } from "react";
import NotFoundClient from "@/components/notfound/NotFoundClient";

export default function NotFound() {
  return (
    <Suspense fallback={<NotFoundFallback />}>
      <NotFoundClient />
    </Suspense>
  );
}

function NotFoundFallback() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-warm-900">
        Página não encontrada
      </h1>
      <p className="mt-3 text-warm-600">Carregando…</p>
    </div>
  );
}
