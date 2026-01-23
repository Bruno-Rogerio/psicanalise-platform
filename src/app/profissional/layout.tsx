import { ProfissionalSidebar } from "@/components/layout/ProfissionalSidebar";

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <ProfissionalSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
