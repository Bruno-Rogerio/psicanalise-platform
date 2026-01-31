export default function PoliticaPrivacidadePage() {
  return (
    <main className="bg-warm-100 py-16">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <h1 className="text-3xl font-semibold text-warm-900">
          Política de Privacidade
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-warm-800/90">
          <p>
            Esta Política de Privacidade descreve como os dados pessoais são
            coletados, utilizados e protegidos na plataforma de atendimento
            psicanalítico online.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            1. Coleta de informações
          </h2>
          <p>
            Coletamos apenas as informações necessárias para o funcionamento da
            plataforma, como nome, e-mail e dados relacionados ao agendamento de
            sessões.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            2. Uso das informações
          </h2>
          <p>
            Os dados são utilizados exclusivamente para gerenciamento de
            atendimentos, comunicação com o usuário e melhoria da experiência na
            plataforma.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            3. Compartilhamento de dados
          </h2>
          <p>
            Não vendemos, alugamos ou compartilhamos dados pessoais com
            terceiros, exceto quando necessário para o funcionamento técnico da
            plataforma ou por obrigação legal.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">4. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger os dados
            contra acessos não autorizados, vazamentos ou uso indevido.
          </p>

          <h2 className="text-lg font-semibold text-warm-900">
            5. Direitos do usuário
          </h2>
          <p>
            O usuário pode solicitar a atualização ou exclusão de seus dados a
            qualquer momento, entrando em contato pelos canais disponibilizados
            na plataforma.
          </p>

          <p className="pt-6 text-xs text-warm-500">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </main>
  );
}
