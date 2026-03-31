import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import EmailButton from "@/components/layout/EmailButton";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";
import { ScrollDepthTracker } from "@/components/analytics/ScrollDepthTracker";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F2EDE8]">
      <PageviewTracker />
      <ScrollDepthTracker />
      <PublicHeader />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <PublicFooter />
      <WhatsAppButton />
      <EmailButton />
    </div>
  );
}
