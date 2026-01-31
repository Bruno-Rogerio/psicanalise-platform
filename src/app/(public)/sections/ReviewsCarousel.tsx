"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Review = {
  id: string;
  nome: string;
  estrelas: number;
  comentario: string;
  created_at: string;
};

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const hasMany = (reviews?.length ?? 0) > 1;

  useEffect(() => setMounted(true), []);

  // --- Helpers
  const clearAutoplay = useCallback(() => {
    if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    autoplayRef.current = null;
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
  }, []);

  const pauseAutoplayTemporarily = useCallback(() => {
    if (!hasMany) return;
    setIsInteracting(true);
    clearAutoplay();
    clearResumeTimer();

    // Retoma depois de um tempinho sem interação (sem botão chato)
    resumeTimerRef.current = window.setTimeout(() => {
      setIsInteracting(false);
    }, 2500);
  }, [clearAutoplay, clearResumeTimer, hasMany]);

  // --- Track active slide (IntersectionObserver)
  useEffect(() => {
    if (!mounted) return;
    const root = scrollerRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    if (cards.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // pega o mais visível
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          )[0];

        if (!visible) return;
        const idx = Number((visible.target as HTMLElement).dataset.index ?? 0);
        if (!Number.isNaN(idx)) setActive(idx);
      },
      {
        root,
        threshold: [0.35, 0.5, 0.65],
      },
    );

    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [mounted, reviews?.length]);

  // --- Autoplay (leve e discreto)
  useEffect(() => {
    if (!mounted) return;
    if (!hasMany) return;
    if (isInteracting) return;

    const el = scrollerRef.current;
    if (!el) return;

    clearAutoplay();

    autoplayRef.current = window.setInterval(() => {
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
      if (cards.length === 0) return;

      const next = (active + 1) % cards.length;
      cards[next]?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }, 5200);

    return () => clearAutoplay();
  }, [active, mounted, hasMany, isInteracting, clearAutoplay]);

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
    cards[idx]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }, []);

  const scrollByOne = useCallback(
    (dir: "prev" | "next") => {
      const el = scrollerRef.current;
      if (!el) return;
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
      if (cards.length === 0) return;

      const next =
        dir === "next"
          ? (active + 1) % cards.length
          : (active - 1 + cards.length) % cards.length;
      cards[next]?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    },
    [active],
  );

  if (!reviews || reviews.length === 0) return null;

  return (
    <section id="avaliacoes" className="py-10 sm:py-12 md:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-warm-500">
              Avaliações
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-warm-900 sm:text-3xl md:text-4xl">
              O que dizem sobre o processo.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Cada pessoa vive a psicanálise de um jeito. Aqui, algumas palavras
              de quem passou por esse caminho.
            </p>
          </div>

          {/* Controls (desktop only) */}
          {reviews.length > 1 ? (
            <div className="hidden items-center gap-3 sm:flex">
              <button
                onClick={() => scrollByOne("prev")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-warm-300/60 bg-white/80 text-warm-700 transition-all duration-300 hover:border-warm-400 hover:bg-white hover:shadow-soft"
                aria-label="Anterior"
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollByOne("next")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-warm-300/60 bg-white/80 text-warm-700 transition-all duration-300 hover:border-warm-400 hover:bg-white hover:shadow-soft"
                aria-label="Próximo"
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* soft fade edges (mobile: smaller) */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-warm-100 to-transparent sm:w-14" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-warm-100 to-transparent sm:w-14" />

          {!mounted ? (
            <ReviewsSkeleton />
          ) : (
            <div
              ref={scrollerRef}
              className={[
                "scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto",
                "pb-3 sm:gap-5",
                // mobile-first spacing to avoid cut + allow "peek"
                "px-1",
              ].join(" ")}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
              onTouchStart={pauseAutoplayTemporarily}
              onTouchMove={pauseAutoplayTemporarily}
              onMouseDown={pauseAutoplayTemporarily}
              onWheel={pauseAutoplayTemporarily}
            >
              {reviews.map((review, idx) => (
                <ReviewCard key={review.id} review={review} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* Dots (mobile-first) */}
        {reviews.length > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2 sm:hidden">
            {reviews.slice(0, 8).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={[
                  "h-1.5 rounded-full transition-all duration-300",
                  active === idx ? "w-6 bg-sage-500" : "w-1.5 bg-warm-300/70",
                ].join(" ")}
                aria-label={`Ir para avaliação ${idx + 1}`}
              />
            ))}
          </div>
        ) : null}

        {/* Small hint (mobile only) */}
        {reviews.length > 1 ? (
          <div className="mt-3 flex justify-center sm:hidden">
            <span className="text-xs text-muted">Deslize para ver mais</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <article
      data-card
      data-index={index}
      className={[
        // Mobile-first width: fits cleanly, with a tiny peek of the next card
        "w-[92%] shrink-0 snap-start",
        "rounded-3xl border border-warm-300/50 bg-white/80 p-6 shadow-soft backdrop-blur-sm",
        "transition-all duration-300 hover:border-warm-400/60 hover:bg-white hover:shadow-soft-lg",
        // Desktop sizing
        "sm:w-[420px]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-400/20 to-warm-500/15 text-base font-semibold text-warm-700">
            {review.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-warm-900">
              {review.nome}
            </p>
            <p className="text-xs text-muted">
              {new Date(review.created_at).toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              filled={i < review.estrelas}
              className="h-4 w-4"
            />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <svg
          className="mb-2 h-6 w-6 text-warm-300"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className="text-sm leading-relaxed text-warm-800/90">
          {review.comentario}
        </p>
      </div>

      <div className="mt-6 h-px w-full bg-gradient-to-r from-rose-300/40 via-warm-300/30 to-transparent" />
    </article>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden pb-3 sm:gap-5">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="w-[92%] shrink-0 rounded-3xl border border-warm-300/30 bg-white/60 p-6 sm:w-[420px]"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-warm-200" />
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-warm-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-warm-200" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-warm-200" />
            <div className="h-3 w-[92%] animate-pulse rounded bg-warm-200" />
            <div className="h-3 w-[78%] animate-pulse rounded bg-warm-200" />
          </div>
          <div className="mt-6 h-px w-full bg-warm-200" />
        </div>
      ))}
    </div>
  );
}

function StarIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`${className} ${filled ? "text-warm-500" : "text-warm-300"}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
