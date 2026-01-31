import { Suspense } from "react";
import { CheckoutSuccessClient } from "./client";

export const dynamic = "force-dynamic";

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-warm-200 border-t-sage-500" />
        <p className="mt-4 text-warm-600">Carregando...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
