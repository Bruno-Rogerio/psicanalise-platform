import { Section } from "./Section";

const items = [
  {
    name: "Instagram",
    description: "Conteúdos curtos, reflexões e avisos de agenda.",
    icon: InstagramIcon,
    href: "https://www.instagram.com/raizaconvento.psicanalista",
    gradient: "from-rose-400/15 to-warm-500/10",
    iconColor: "text-rose-500",
  },
  {
    name: "LinkedIn",
    description: "Artigos e temas sobre saúde mental no cotidiano.",
    icon: LinkedInIcon,
    href: "#",
    gradient: "from-soft-400/15 to-soft-500/10",
    iconColor: "text-soft-600",
  },
  {
    name: "YouTube",
    description: "Vídeos e conversas mais profundas, sem pressa.",
    icon: YouTubeIcon,
    href: "#",
    gradient: "from-sage-400/15 to-sage-500/10",
    iconColor: "text-sage-600",
  },
];

export function RedesSociais() {
  return (
    <Section
      eyebrow="Presença"
      title="Se quiser, a gente se encontra também por lá."
      subtitle="Conteúdos com cuidado e responsabilidade clínica, sem promessas fáceis."
      className="bg-gradient-to-b from-transparent via-soft-100/20 to-transparent"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className="group relative overflow-hidden rounded-3xl border border-warm-300/50 bg-white/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-400 hover:-translate-y-1 hover:border-warm-400/60 hover:bg-white hover:shadow-soft-lg"
            >
              {/* Background gradient */}
              <div
                className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${item.gradient} opacity-40 blur-2xl transition-opacity duration-400 group-hover:opacity-70`}
              />

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} ring-1 ring-warm-300/30 transition-all duration-300 group-hover:ring-warm-400/50`}
                    >
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-warm-900">{item.name}</p>
                      <p className="text-xs text-muted">Seguir</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-200/50 text-warm-600 transition-all duration-300 group-hover:bg-warm-300/50 group-hover:text-warm-800">
                    <svg
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>

                {/* Decorative line */}
                <div className="mt-5 h-px w-full bg-gradient-to-r from-warm-300/50 via-warm-200/30 to-transparent" />
              </div>
            </a>
          );
        })}
      </div>
    </Section>
  );
}

// Icons
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
