'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { listAuthorPosts, deletePost, publishPost, archivePost } from '@/services/blog';
import type { BlogPost, PostStatus } from '@/types/blog';

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PostStatus | 'all'>('all');

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) return;

      const data = await listAuthorPosts(auth.user.id);
      setPosts(data);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(postId: string) {
    try {
      await publishPost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Erro ao publicar:', error);
      alert('Erro ao publicar o post');
    }
  }

  async function handleArchive(postId: string) {
    try {
      await archivePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      alert('Erro ao arquivar o post');
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Tem certeza que deseja excluir este post permanentemente?')) return;

    try {
      await deletePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir o post');
    }
  }

  const filteredPosts =
    filter === 'all' ? posts : posts.filter((p) => p.status === filter);

  const statusLabel: Record<PostStatus, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'bg-warm-200 text-warm-700' },
    published: { label: 'Publicado', color: 'bg-sage-100 text-sage-700' },
    archived: { label: 'Arquivado', color: 'bg-rose-100 text-rose-700' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Blog</h1>
          <p className="mt-1 text-sm text-warm-600">
            Gerencie seus artigos e publicações
          </p>
        </div>

        <Link
          href="/profissional/blog/novo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sage-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:bg-sage-700 hover:shadow-soft-lg"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Novo post
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['all', 'draft', 'published', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-warm-900 text-white'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            }`}
          >
            {status === 'all'
              ? 'Todos'
              : statusLabel[status as PostStatus].label}
          </button>
        ))}
      </div>

      {/* Lista de posts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-warm-200 border-t-sage-600" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-warm-300 py-16 text-center">
          <svg
            className="mx-auto h-12 w-12 text-warm-400"
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
          <h3 className="mt-4 text-lg font-semibold text-warm-900">
            Nenhum post encontrado
          </h3>
          <p className="mt-2 text-sm text-warm-600">
            Comece criando seu primeiro artigo
          </p>
          <Link
            href="/profissional/blog/novo"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sage-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sage-700"
          >
            Criar primeiro post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col gap-4 rounded-2xl border border-warm-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="truncate text-lg font-semibold text-warm-900">
                    {post.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusLabel[post.status].color
                    }`}
                  >
                    {statusLabel[post.status].label}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-warm-600">
                  {post.excerpt}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-warm-500">
                  <span>
                    Atualizado em{' '}
                    {new Date(post.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                  {post.views > 0 && <span>{post.views} visualizações</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {post.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(post.id)}
                    className="rounded-lg bg-sage-100 px-3 py-2 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-200"
                  >
                    Publicar
                  </button>
                )}
                {post.status === 'published' && (
                  <>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="rounded-lg bg-warm-100 px-3 py-2 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-200"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => handleArchive(post.id)}
                      className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-200"
                    >
                      Arquivar
                    </button>
                  </>
                )}
                <Link
                  href={`/profissional/blog/${post.id}/editar`}
                  className="rounded-lg bg-warm-100 px-3 py-2 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-200"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
