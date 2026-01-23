import Link from "next/link";

export default function DashboardClientePage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Bem-vindo(a).
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#6F6F6F] sm:text-base">
          Aqui você agenda suas sessões, acompanha a próxima consulta e encontra
          seu histórico. Tudo com clareza, no seu tempo.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Agendamento
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Agendar nova sessão
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
            Escolha um horário exato, tipo de atendimento (chat/vídeo) e
            finalize.
          </p>
          <Link
            href="/agenda"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-[#111111] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Ver horários disponíveis
          </Link>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Próxima sessão
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Nenhuma sessão marcada
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
            Assim que você agendar, sua próxima sessão aparece aqui com dia,
            horário e acesso.
          </p>
          <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
            Dica: você pode cancelar com reembolso até 24h antes.
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Organização
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            Suas consultas
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F6F6F]">
            Histórico por data, tipo de sessão e status (realizada, futura,
            reagendada).
          </p>
          <Link
            href="/minhas-sessoes"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-50"
          >
            Ver histórico
          </Link>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Histórico recente
            </h2>
            <p className="mt-1 text-sm text-[#6F6F6F]">
              Aqui vão aparecer suas últimas sessões.
            </p>
          </div>
          <Link
            href="/minhas-sessoes"
            className="text-sm text-zinc-700 hover:text-zinc-900"
          >
            Ver tudo →
          </Link>
        </div>

        <div className="rounded-xl border border-[#E5E3DF] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <p className="text-sm text-[#6F6F6F]">
            Ainda não há sessões no seu histórico.
          </p>
        </div>
      </section>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {children}
    </div>
  );
}
