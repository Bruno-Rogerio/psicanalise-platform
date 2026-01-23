export function Section({
  title,
  subtitle,
  children,
  id,
  eyebrow,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {title ? (
          <div className="mb-8 sm:mb-10">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6F6F] sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}
