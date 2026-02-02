"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-6 mt-10 text-3xl font-semibold text-warm-900 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 mt-10 text-2xl font-semibold text-warm-900 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 text-xl font-semibold text-warm-900 first:mt-0">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-6 text-base leading-relaxed text-warm-800/90">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-4 border-sage-400 bg-sage-50/50 py-4 pl-6 pr-4 italic text-warm-700">
        {children}
      </blockquote>
    ),
    ul: ({ children }) => (
      <ul className="mb-6 list-disc space-y-2 pl-6 text-warm-800/90">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-6 list-decimal space-y-2 pl-6 text-warm-800/90">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-sage-600 underline decoration-sage-300 underline-offset-4 transition-colors hover:text-sage-700 hover:decoration-sage-500"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-warm-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-warm-700">{children}</em>,
    hr: () => <hr className="my-10 border-t border-warm-200" />,

    img: ({ src, alt }) => {
      // ✅ react-markdown tipa src como string | Blob
      // Para não quebrar o build (Vercel/SSR), normalizamos para string.
      const srcStr = typeof src === "string" ? src : "";

      // YouTube
      if (
        srcStr &&
        (srcStr.includes("youtube.com") || srcStr.includes("youtu.be"))
      ) {
        const videoId = extractYouTubeId(srcStr);
        if (videoId) {
          return (
            <div className="my-8 aspect-video overflow-hidden rounded-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={alt || "Vídeo do YouTube"}
              />
            </div>
          );
        }
      }

      // Vimeo
      if (srcStr && srcStr.includes("vimeo.com")) {
        const videoId = extractVimeoId(srcStr);
        if (videoId) {
          return (
            <div className="my-8 aspect-video overflow-hidden rounded-2xl">
              <iframe
                src={`https://player.vimeo.com/video/${videoId}`}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={alt || "Vídeo do Vimeo"}
              />
            </div>
          );
        }
      }

      // Imagem normal
      return (
        <span className="my-8 block overflow-hidden rounded-2xl">
          <img src={srcStr} alt={alt || ""} className="w-full object-cover" />
          {alt && (
            <span className="mt-2 block text-center text-sm text-warm-500">
              {alt}
            </span>
          )}
        </span>
      );
    },

    code: ({ className, children }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="rounded bg-warm-100 px-1.5 py-0.5 font-mono text-sm text-warm-800">
            {children}
          </code>
        );
      }
      return (
        <code className="block overflow-x-auto rounded-xl bg-warm-900 p-4 font-mono text-sm text-warm-100">
          {children}
        </code>
      );
    },

    pre: ({ children }) => (
      <pre className="my-6 overflow-hidden rounded-xl">{children}</pre>
    ),
  };

  return (
    <article className="prose-custom">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
    /youtube\.com\/v\/([^&?/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] || null;
}
