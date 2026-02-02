import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-100 via-warm-100 to-soft-100/30">
      <PublicHeader />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
