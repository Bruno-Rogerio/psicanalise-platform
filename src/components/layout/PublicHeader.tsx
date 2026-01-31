"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300",
        scrolled
          ? "bg-warm-100/95 border-warm-300/60 shadow-soft"
          : "bg-warm-100/70 border-warm-300/40",
      ].join(" ")}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="group inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Psicanálise"
            width={140}
            height={40}
            priority
            className="h-15 w-auto transition-opacity duration-300 group-hover:opacity-90"
          />
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className={[
              "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
              "text-warm-900/70 hover:text-warm-900",
              "hover:bg-warm-300/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-100",
            ].join(" ")}
          >
            Entrar
          </Link>

          <Link
            href="/cadastro"
            className={[
              "rounded-xl px-5 py-2 text-sm font-medium transition-all duration-300",
              "bg-sage-600 text-warm-50 shadow-soft",
              "hover:bg-sage-700 hover:shadow-soft-lg",
              "active:scale-[0.99]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-100",
            ].join(" ")}
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
