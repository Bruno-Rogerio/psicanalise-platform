"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
  className?: string;
  threshold?: number;
  duration?: number;
  trackSection?: string; // e.g. "Sobre", "Como Funciona"
}

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
  threshold = 0.12,
  duration = 700,
  trackSection,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (trackSection) {
            trackEvent("section_view", "section", trackSection);
          }
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, trackSection]);

  const hidden: Record<RevealProps["direction"] & string, React.CSSProperties> = {
    up:    { opacity: 0, transform: "translateY(36px)" },
    left:  { opacity: 0, transform: "translateX(-32px)" },
    right: { opacity: 0, transform: "translateX(32px)" },
    scale: { opacity: 0, transform: "scale(0.93) translateY(20px)" },
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(visible ? { opacity: 1, transform: "none" } : hidden[direction]),
        transition: `opacity ${duration}ms cubic-bezier(.22,.68,0,1.2) ${delay}ms, transform ${duration}ms cubic-bezier(.22,.68,0,1.2) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
