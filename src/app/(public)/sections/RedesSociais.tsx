import { Reveal } from "@/components/ui/Reveal";

const items = [
  {
    name: "Instagram",
    handle: "@raizaconvento.psicanalista",
    description: "Reflexões curtas, conteúdos sobre saúde mental e avisos de agenda.",
    icon: InstagramIcon,
    href: "https://www.instagram.com/raizaconvento.psicanalista",
    color: "#E8755A",
    bg: "#E8755A12",
  },
];

export function RedesSociais() {
  return (
    <section className="relative overflow-hidden bg-[#F2EDE8] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E8755A]/5 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-72 w-72 rounded-full bg-[#4A7C59]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6">

        <Reveal direction="up" delay={0} className="mb-14 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B0A098]">Presença</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#1A1614] sm:text-5xl">
            A gente se encontra{" "}
            <span className="italic text-[#E8755A]">por lá também.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#8B7B72]">
            Conteúdos com cuidado e responsabilidade clínica, sem promessas fáceis.
          </p>
        </Reveal>

        <Reveal direction="scale" delay={80} className="mx-auto max-w-md">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl border border-[#E8E0DC]/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ backgroundColor: item.color + "20" }}
                />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundColor: item.bg }}
                      >
                        <Icon className="h-7 w-7" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1614]">{item.name}</p>
                        <p className="text-xs text-[#B0A098]">{item.handle}</p>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E0DC] bg-[#F2EDE8] text-[#B0A098] transition-all duration-300 group-hover:border-[#D0C8C0] group-hover:text-[#4A3F3A]">
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-[#8B7B72]">{item.description}</p>
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-[#E8E0DC] via-[#E8E0DC]/40 to-transparent" />
                </div>
              </a>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
      <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
