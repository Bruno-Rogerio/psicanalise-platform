import Link from "next/link";

export function ProfissionalSidebar() {
  return (
    <aside className="w-64 border-r border-zinc-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold">Painel</h2>

      <nav className="flex flex-col gap-3 text-sm">
        <Link href="/profissional/agenda" className="hover:text-black">
          Agenda
        </Link>
        <Link href="/profissional/pacientes" className="hover:text-black">
          Pacientes
        </Link>
        <Link href="/profissional/sessoes" className="hover:text-black">
          Sessões
        </Link>
        <Link href="/profissional/financeiro" className="hover:text-black">
          Financeiro
        </Link>
        <Link href="/profissional/configuracoes" className="hover:text-black">
          Configurações
        </Link>
      </nav>
    </aside>
  );
}
