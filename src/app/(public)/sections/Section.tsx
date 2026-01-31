export function Section({
  title,
  subtitle,
  children,
  id,
  eyebrow,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`py-12 sm:py-14 md:py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {title ? (
          <div className="mb-10 sm:mb-12">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-warm-500">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-warm-900 sm:text-3xl md:text-4xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
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
