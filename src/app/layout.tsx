import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

export const metadata = {
  title: "Raiza Convento - Psicanalista",
  description:
    "Plataforma de Raiza Convento - Psicanalista - Um espaço seguro para falar, sentir e se escutar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-warm-100 text-warm-900 antialiased">
        {children}

        {/* Google Analytics GLOBAL */}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
