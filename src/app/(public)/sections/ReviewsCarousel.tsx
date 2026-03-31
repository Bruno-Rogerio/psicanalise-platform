"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  const getCards = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return [];
    return Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
  }, []);

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
    resumeTimerRef.current = window.setTimeout(() => setIsInteracting(false), 2200);
  }, [clearAutoplay, clearResumeTimer, hasMany]);

  const scrollToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el) return;
      const cards = getCards();
      const target = cards[idx];
      if (!target) return;
      el.scrollTo({ left: target.offsetLeft, behavior });
    },
    [getCards],
  );

  const scrollByOne = useCallback(
    (dir: "prev" | "next") => {
      const cards = getCards();
      if (cards.length === 0) return;
      const next =
        dir === "next"
          ? (active + 1) % cards.length
          : (active - 1 + cards.length) % cards.length;
      scrollToIndex(next);
    },
    [active, getCards, scrollToIndex],
  );

  useEffect(() => {
    if (!mounted) return;
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const cards = getCards();
      if (cards.length === 0) return;
      const left = el.scrollLeft;
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < cards.length; i++) {
        const dist = Math.abs(cards[i].offsetLeft - left);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
      setActive(bestIdx);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [mounted, getCards, reviews?.length]);

  useEffect(() => {
    if (!mounted || !hasMany || isInteracting) return;
    clearAutoplay();
    autoplayRef.current = window.setInterval(() => {
      const cards = getCards();
      if (cards.length <= 1) return;
      const next = (active + 1) % cards.length;
      scrollToIndex(next, "smooth");
    }, 5200);
    return () => clearAutoplay();
  }, [active, mounted, hasMany, isInteracting, clearAutoplay, getCards, scrollToIndex]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <section id="avaliacoes" className="relative overflow-hidden bg-[#1A1614] py-20 sm:py-28">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#E8755A]/5 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-[#4A7C59]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E8755A]">
              Avaliações
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              O que dizem sobre{" "}
              <span className="italic text-[#E8755A]">o processo.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/50">
              Cada pessoa vive a psicanálise de um jeito. Aqui, algumas palavras de quem passou por esse caminho.
            </p>
          </div>

          {/* Controls */}
          {reviews.length > 1 && (
            <div className="hidden items-center gap-3 sm:flex">
              <button
                onClick={() => { pauseAutoplayTemporarily(); scrollByOne("prev"); }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                aria-label="Anterior"
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { pauseAutoplayTemporarily(); scrollByOne("next"); }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                aria-label="Próximo"
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#1A1614] to-transparent sm:w-16" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#1A1614] to-transparent sm:w-16" />

          {!mounted ? (
            <ReviewsSkeleton />
          ) : (
            <div
              ref={scrollerRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:gap-5"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
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

        {/* Dots */}
        {reviews.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {reviews.slice(0, 8).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { pauseAutoplayTemporarily(); scrollToIndex(idx); }}
                className={[
                  "h-1.5 rounded-full transition-all duration-300",
                  active === idx ? "w-8 bg-[#E8755A]" : "w-1.5 bg-white/20",
                ].join(" ")}
                aria-label={`Ir para avaliação ${idx + 1}`}
              />
            ))}
          </div>
        )}
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
        "w-[92%] shrink-0 snap-start",
        "rounded-3xl border border-white/8 bg-white/5 p-7 backdrop-blur-sm",
        "transition-all duration-300 hover:border-white/15 hover:bg-white/8",
        "sm:w-[440px]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8755A]/20 text-base font-bold text-[#E8755A]">
            {review.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{review.nome}</p>
            <p className="text-xs text-white/35">
              {new Date(review.created_at).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`h-4 w-4 ${i < review.estrelas ? "text-[#D4A72C]" : "text-white/15"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div className="mt-6">
        <svg className="mb-3 h-7 w-7 text-[#E8755A]/30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className="text-sm leading-relaxed text-white/65">{review.comentario}</p>
      </div>

      <div className="mt-6 h-px w-full bg-gradient-to-r from-[#E8755A]/20 via-white/5 to-transparent" />
    </article>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden pb-3 sm:gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-[92%] shrink-0 rounded-3xl border border-white/5 bg-white/5 p-7 sm:w-[440px]"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded-lg bg-white/10" />
              <div className="h-3 w-16 animate-pulse rounded-lg bg-white/10" />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="h-3 w-full animate-pulse rounded-lg bg-white/10" />
            <div className="h-3 w-[90%] animate-pulse rounded-lg bg-white/10" />
            <div className="h-3 w-[75%] animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
