"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Review = {
  id: string;
  nome: string;
  estrelas: number;
  comentario: string | null;
  created_at: string;
};

function Stars({ value }: { value: number }) {
  const stars = useMemo(
    () => Array.from({ length: 5 }, (_, i) => i < value),
    [value],
  );
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${value} de 5 estrelas`}
    >
      {stars.map((filled, idx) => (
        <span key={idx} className={filled ? "text-zinc-950" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  function scrollByCards(dir: "left" | "right") {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card='review']");
    const w = card ? card.offsetWidth : 360;
    el.scrollBy({ left: dir === "left" ? -w : w, behavior: "smooth" });
  }

  // Autoplay suave (mobile first)
  useEffect(() => {
    if (!reviews?.length) return;
    if (paused) return;

    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;

      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + 380;

      if (next >= max - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 380, behavior: "smooth" });
      }
    }, 4500);

    return () => window.clearInterval(id);
  }, [paused, reviews]);

  return (
    <section id="avaliacoes" className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Avaliações
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Palavras de quem já viveu esse espaço.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6F6F] sm:text-base">
              Depoimentos sobre acolhimento, escuta e psicanálise. Deslize no
              celular ou use as setas no desktop.
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards("left")}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              aria-label="Voltar"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollByCards("right")}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              aria-label="Avançar"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-7">
          {reviews?.length ? (
            <div
              ref={scrollerRef}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused(true)}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {reviews.map((r) => (
                <article
                  key={r.id}
                  data-card="review"
                  className="w-[88%] shrink-0 snap-start rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] sm:w-[420px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {r.nome}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(r.created_at)}
                      </p>
                    </div>
                    <Stars value={r.estrelas} />
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-zinc-700">
                    “{r.comentario || "Avaliação sem comentário."}”
                  </p>

                  <div className="mt-6 h-px w-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent" />
                  <p className="mt-3 text-xs text-zinc-500">
                    Atendimento psicanalítico online
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <ReviewsSkeleton />
          )}

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-zinc-500 sm:hidden">
              Deslize para ver mais →
            </p>
            {reviews?.length ? (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                {paused ? "Retomar autoplay" : "Pausar autoplay"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-[88%] shrink-0 rounded-xl border border-zinc-200 bg-white p-6 sm:w-[420px]"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="mt-5 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-[92%] animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-[78%] animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="mt-6 h-px w-full bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}
