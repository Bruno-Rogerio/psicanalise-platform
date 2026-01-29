import "./globals.css";

export const metadata = {
  title: "Psicanálise",
  description:
    "Plataforma de psicanálise online - Um espaço seguro para falar, sentir e se escutar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-warm-100 text-warm-900 antialiased">{children}</body>
    </html>
  );
}
