import { Section } from "./Section";
import { Instagram, Linkedin, Youtube } from "lucide-react";

const items = [
  {
    name: "Instagram",
    desc: "Conteúdos curtos, reflexões e avisos de agenda.",
    icon: Instagram,
    href: "#",
  },
  {
    name: "LinkedIn",
    desc: "Artigos e temas sobre saúde mental no cotidiano.",
    icon: Linkedin,
    href: "#",
  },
  {
    name: "YouTube",
    desc: "Vídeos e conversas mais profundas, sem pressa.",
    icon: Youtube,
    href: "#",
  },
];

export function RedesSociais() {
  return (
    <Section
      eyebrow="Presença"
      title="Se quiser, a gente se encontra também por lá."
      subtitle="Conteúdos com cuidado e responsabilidade clínica, sem promessas fáceis."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <a
              key={it.name}
              href={it.href}
              className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                  <Icon className="h-5 w-5 text-zinc-900" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {it.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Abrir</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#6F6F6F]">
                {it.desc}
              </p>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent" />
            </a>
          );
        })}
      </div>
    </Section>
  );
}
