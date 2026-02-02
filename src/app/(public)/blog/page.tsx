import { listPublishedPosts } from '@/services/blog';
import { BlogCard } from '@/components/blog';
import Link from 'next/link';

export const revalidate = 60; // Revalidar a cada 60 segundos

export default async function BlogPage() {
  const posts = await listPublishedPosts(20, 0);

  return (
    <main className="bg-warm-100 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.25em] text-warm-500">
            Blog
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-warm-900 sm:text-4xl md:text-5xl">
            Reflexões e Cuidados
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Artigos sobre psicanálise, autoconhecimento e bem-estar emocional
            para acompanhar você no seu caminho.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warm-200">
              <svg
                className="h-10 w-10 text-warm-400"
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
            <h2 className="mt-4 text-xl font-semibold text-warm-900">
              Ainda não há publicações
            </h2>
            <p className="mt-2 text-muted">
              Em breve, novos conteúdos serão compartilhados aqui.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-sage-50 to-soft-50 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold text-warm-900">
            Quer conversar sobre o que leu?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-warm-700">
            Se algum conteúdo ressoou com você, agende uma sessão para
            explorarmos juntos esses temas em um espaço acolhedor e seguro.
          </p>
          <Link
            href="/agenda"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-sage-600 px-8 py-4 text-base font-semibold text-warm-50 shadow-soft transition-all duration-300 hover:bg-sage-700 hover:shadow-soft-lg"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Agendar sessão
          </Link>
        </div>
      </div>
    </main>
  );
}
