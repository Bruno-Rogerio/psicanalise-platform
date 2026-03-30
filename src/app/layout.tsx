import "./globals.css";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ToastProvider } from "@/contexts/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-warm-100 font-sans text-warm-900 antialiased">
        <ToastProvider>{children}</ToastProvider>

        {/* Google Analytics GLOBAL */}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
