"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type Review = {
  id: string;
  nome: string;
  estrelas: number;
  comentario: string;
  created_at: string;
};

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Autoplay scroll
  useEffect(() => {
    if (!mounted || paused || reviews.length < 3) return;

    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const nextScroll = container.scrollLeft + 360;

      if (nextScroll >= maxScroll) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 360, behavior: "smooth" });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted, paused, reviews.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = direction === "left" ? -360 : 360;
    container.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section
      id="avaliacoes"
      className="py-10 sm:py-12 md:py-14 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
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

          {/* Navigation controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-warm-300/60 bg-white/80 text-warm-700 transition-all duration-300 hover:border-warm-400 hover:bg-white hover:shadow-soft"
              aria-label="Anterior"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-warm-300/60 bg-white/80 text-warm-700 transition-all duration-300 hover:border-warm-400 hover:bg-white hover:shadow-soft"
              aria-label="Próximo"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-warm-100 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-warm-100 to-transparent" />

          {/* Scrollable container */}
          {!mounted ? (
            <ReviewsSkeleton />
          ) : (
            <div
              ref={scrollRef}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>

        {/* Autoplay control */}
        {reviews.length > 2 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex items-center gap-2 text-xs text-muted transition-colors duration-300 hover:text-warm-700"
            >
              {paused ? (
                <>
                  <PlayIcon className="h-3.5 w-3.5" />
                  Retomar autoplay
                </>
              ) : (
                <>
                  <PauseIcon className="h-3.5 w-3.5" />
                  Pausar autoplay
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="w-[88%] shrink-0 snap-start rounded-3xl border border-warm-300/50 bg-white/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-400 hover:border-warm-400/60 hover:bg-white hover:shadow-soft-lg sm:w-[400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-400/20 to-warm-500/15 text-base font-semibold text-warm-700">
            {review.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-warm-900">{review.nome}</p>
            <p className="text-xs text-muted">
              {new Date(review.created_at).toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Stars */}
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

      {/* Quote */}
      <div className="mt-5">
        <svg
          className="mb-2 h-6 w-6 text-warm-300"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className="text-sm leading-relaxed text-warm-800/90">
          {review.comentario}
        </p>
      </div>

      {/* Decorative line */}
      <div className="mt-6 h-px w-full bg-gradient-to-r from-rose-300/40 via-warm-300/30 to-transparent" />
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-[88%] shrink-0 rounded-3xl border border-warm-300/30 bg-white/60 p-6 sm:w-[400px]"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-warm-200" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-warm-200" />
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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
