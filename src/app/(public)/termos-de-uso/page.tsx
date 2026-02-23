export default function TermosDeUsoPage() {
  return (
    <main className="bg-warm-100 py-16">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <h1 className="text-3xl font-semibold text-warm-900">Termos de Uso</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-warm-800/90">
          <p>
            Ao utilizar esta plataforma, você concorda com os termos descritos
            abaixo. Recomendamos a leitura atenta antes de prosseguir com o uso
            dos serviços.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            1. Sobre a plataforma
          </h2>
          <p>
            A plataforma tem como objetivo intermediar o agendamento e a
            realização de sessões de psicanálise online, oferecendo um ambiente
            seguro para comunicação entre profissional e cliente.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            2. Responsabilidades do usuário
          </h2>
          <p>
            O usuário se compromete a fornecer informações verdadeiras, manter a
            confidencialidade de sua conta e utilizar a plataforma de forma
            respeitosa e ética.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            3. Atendimentos
          </h2>
          <p>
            As sessões realizadas por meio da plataforma seguem os princípios
            éticos da psicanálise. A plataforma não substitui atendimentos de
            emergência médica ou psiquiátrica.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            4. Cancelamentos e reagendamentos
          </h2>
          <p>
            Regras de cancelamento e reagendamento podem variar conforme a
            política definida pelo profissional responsável.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            5. Alterações nos termos
          </h2>
          <p>
            Estes termos podem ser atualizados periodicamente. O uso contínuo da
            plataforma implica concordância com as versões mais recentes.
          </p>

          <p className="pt-6 text-xs text-warm-500">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </main>
  );
}

