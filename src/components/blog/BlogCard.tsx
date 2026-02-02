import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border border-warm-300/50 bg-white/80 shadow-soft backdrop-blur-sm transition-all duration-300 hover:border-warm-400/60 hover:bg-white hover:shadow-soft-lg"
    >
      {/* Imagem de capa */}
      <div className="relative aspect-[16/10] overflow-hidden bg-warm-100">
        {post.featured_image_url ? (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-warm-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        {formattedDate && (
          <p className="text-xs font-medium text-warm-500">{formattedDate}</p>
        )}

        <h3 className="mt-2 text-lg font-semibold text-warm-900 transition-colors group-hover:text-sage-700">
          {post.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-sage-600 transition-colors group-hover:text-sage-700">
          <span>Ler mais</span>
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
        </div>
      </div>
    </Link>
  );
}
