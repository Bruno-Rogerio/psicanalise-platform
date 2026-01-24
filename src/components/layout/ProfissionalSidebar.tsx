"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Agenda", href: "/profissional/agenda" },
  { label: "Pacientes", href: "/profissional/pacientes" },
  { label: "Sessões", href: "/profissional/sessoes" },
  { label: "Financeiro", href: "/profissional/financeiro" },
  { label: "Configurações", href: "/profissional/configuracoes" },
];

export function ProfissionalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Painel do profissional
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">
          Área administrativa
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-200 px-6 py-4">
        <p className="text-xs text-zinc-500">Sigilo e ética profissional</p>
      </div>
    </aside>
  );
}
