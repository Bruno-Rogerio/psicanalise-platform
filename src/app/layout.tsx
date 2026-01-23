import "./globals.css";

export const metadata = {
  title: "Psicanálise",
  description: "Plataforma de psicanálise online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#EEF3EF] text-[#1F1F1F] antialiased">
        {children}
      </body>
    </html>
  );
}
