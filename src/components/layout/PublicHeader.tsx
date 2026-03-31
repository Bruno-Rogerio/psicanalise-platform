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
          ? "border-[#E8E0DC]/60 bg-[#F2EDE8]/95 shadow-sm"
          : "border-[#E8E0DC]/30 bg-[#F2EDE8]/70",
      ].join(" ")}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Psicanálise"
            width={140}
            height={40}
            priority
            className="h-16 w-auto transition-opacity duration-300 group-hover:opacity-80"
          />
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            href="/blog"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#8B7B72] transition-all duration-300 hover:bg-[#1A1614]/5 hover:text-[#1A1614]"
          >
            Blog
          </Link>

          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#8B7B72] transition-all duration-300 hover:bg-[#1A1614]/5 hover:text-[#1A1614]"
          >
            Entrar
          </Link>

          <Link
            href="/cadastro"
            className="ml-1 rounded-xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#2C2420] hover:shadow-md active:scale-[0.99]"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
