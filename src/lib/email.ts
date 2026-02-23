type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const PROFESSIONAL_EMAIL = process.env.PROFESSIONAL_EMAIL;

export async function sendEmail(params: SendEmailParams) {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error("Email provider not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  name?: string | null;
  verifyUrl: string;
}) {
  const name = params.name?.trim() || "cliente";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verificacao de email</h2>
      <p>Ola ${name},</p>
      <p>Para ativar sua conta, confirme seu email clicando no link abaixo:</p>
      <p><a href="${params.verifyUrl}">Confirmar email</a></p>
      <p>Se voce nao solicitou este cadastro, ignore esta mensagem.</p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Confirme seu email",
    html,
  });
}

export async function sendProfessionalSignupNotification(params: {
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
}) {
  if (!PROFESSIONAL_EMAIL) {
    throw new Error("Professional email not configured");
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Novo cadastro</h2>
      <p><strong>Nome:</strong> ${params.name}</p>
      <p><strong>Email:</strong> ${params.email}</p>
      <p><strong>Telefone:</strong> ${params.phone || "(nao informado)"}</p>
      <p><strong>Data:</strong> ${params.createdAt}</p>
    </div>
  `;

  await sendEmail({
    to: PROFESSIONAL_EMAIL,
    subject: "Novo cliente cadastrado",
    html,
  });
}
