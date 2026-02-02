import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug, listPublishedPosts } from '@/services/blog';
import { BlogContent, BlogCTA } from '@/components/blog';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await listPublishedPosts(100, 0);
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <main className="bg-warm-100 py-12 md:py-16">
      <article className="mx-auto max-w-3xl px-5 sm:px-6">
        {/* Voltar */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-warm-600 transition-colors hover:text-warm-900"
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
          Voltar para o blog
        </Link>

        {/* Header */}
        <header className="mt-8">
          {formattedDate && (
            <p className="text-sm font-medium text-warm-500">{formattedDate}</p>
          )}

          <h1 className="mt-3 text-3xl font-semibold leading-tight text-warm-900 sm:text-4xl">
            {post.title}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-warm-700">
            {post.excerpt}
          </p>
        </header>

        {/* Imagem de capa */}
        {post.featured_image_url && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Linha decorativa */}
        <div className="my-10 h-px bg-gradient-to-r from-warm-300/60 via-warm-200/25 to-transparent" />

        {/* Conteúdo */}
        <BlogContent content={post.content} />

        {/* CTA */}
        <BlogCTA />

        {/* Footer do post */}
        <footer className="mt-16 border-t border-warm-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-warm-500">
              {post.views > 0 && `${post.views} visualizações`}
            </p>

            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-xl border border-warm-300 bg-white px-4 py-2 text-sm font-medium text-warm-700 transition-all hover:border-warm-400 hover:shadow-soft"
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
              Ver mais artigos
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
