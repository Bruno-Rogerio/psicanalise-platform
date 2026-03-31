const items = [
  {
    name: "Instagram",
    handle: "@raizaconvento.psicanalista",
    description: "Reflexões curtas, conteúdos sobre saúde mental e avisos de agenda.",
    icon: InstagramIcon,
    href: "https://www.instagram.com/raizaconvento.psicanalista",
    color: "#E8755A",
    bg: "#E8755A15",
  },
  {
    name: "LinkedIn",
    handle: "Raiza Convento",
    description: "Artigos aprofundados e temas sobre psicanálise no cotidiano.",
    icon: LinkedInIcon,
    href: "https://linkedin.com/in/raiza-convento",
    color: "#5B5EA6",
    bg: "#5B5EA615",
  },
];

export function RedesSociais() {
  return (
    <section className="relative overflow-hidden bg-[#1A1614] py-20 sm:py-28">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E8755A]/5 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-72 w-72 rounded-full bg-[#5B5EA6]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6">

        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E8755A]">
            Presença
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            A gente se encontra{" "}
            <span className="italic text-[#E8755A]">por lá também.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/45">
            Conteúdos com cuidado e responsabilidade clínica, sem promessas fáceis.
          </p>
        </div>

        {/* Social cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/5 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/8"
              >
                {/* Glow on hover */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ backgroundColor: item.color + "18" }}
                />

                <div className="relative">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundColor: item.bg }}
                      >
                        <Icon className="h-6 w-6" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-xs text-white/35">{item.handle}</p>
                      </div>
                    </div>

                    {/* Arrow button */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white">
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-5 text-sm leading-relaxed text-white/50">
                    {item.description}
                  </p>

                  {/* Bottom line */}
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Icons
function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
      <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedInIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}
