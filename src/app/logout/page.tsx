"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    })();
  }, [router, supabase]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <p className="text-sm text-[#6F6F6F]">Saindo…</p>
    </div>
  );
}
