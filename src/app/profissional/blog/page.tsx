'use client';

import { useEffect, useState } from 'react';
import { useToast } from "@/contexts/ToastContext";
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { listAuthorPosts, deletePost, publishPost, archivePost } from '@/services/blog';
import type { BlogPost, PostStatus } from '@/types/blog';

export default function BlogAdminPage() {
  const { toast } = useToast();
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
      toast('Erro ao publicar o post', 'error');
    }
  }

  async function handleArchive(postId: string) {
    try {
      await archivePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      toast('Erro ao arquivar o post', 'error');
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Tem certeza que deseja excluir este post permanentemente?')) return;

    try {
      await deletePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast('Erro ao excluir o post', 'error');
    }
  }

  const filteredPosts =
    filter === 'all' ? posts : posts.filter((p) => p.status === filter);

  const statusConfig: Record<PostStatus, { label: string; badge: string }> = {
    draft: {
      label: 'Rascunho',
      badge: 'inline-flex items-center rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]',
    },
    published: {
      label: 'Publicado',
      badge: 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700',
    },
    archived: {
      label: 'Arquivado',
      badge: 'inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700',
    },
  };

  const filterTabs: { value: PostStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'published', label: 'Publicados' },
    { value: 'draft', label: 'Rascunhos' },
    { value: 'archived', label: 'Arquivados' },
  ];

  return (
    <div className="min-h-screen bg-[#F2EDE8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">
              Profissional
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">
              Blog
            </h1>
            <p className="mt-1 text-sm text-[#8B7B72]">
              Gerencie seus artigos e publicações
            </p>
          </div>
          <Link
            href="/profissional/blog/novo"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2A2320]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Post
          </Link>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="inline-flex w-full overflow-x-auto rounded-2xl border border-[#E8E0DC] bg-[#F8F4F1] p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                filter === tab.value
                  ? 'bg-white text-[#2C2420] shadow-sm'
                  : 'text-[#8B7B72] hover:text-[#2C2420]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Post List ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-[#F5F0ED]" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#E8E0DC] py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F0ED]">
              <svg
                className="h-8 w-8 text-[#B0A098]"
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
            <h3 className="mt-5 text-lg font-bold text-[#2C2420]">Nenhum post encontrado</h3>
            <p className="mt-2 text-sm text-[#8B7B72]">Comece criando seu primeiro artigo</p>
            <Link
              href="/profissional/blog/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#1A1614] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2A2320]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar primeiro post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-6 shadow-[0_1px_16px_rgba(44,36,32,0.07)] transition-shadow hover:shadow-[0_4px_24px_rgba(44,36,32,0.10)]"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={statusConfig[post.status].badge}>
                        {statusConfig[post.status].label}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-lg font-bold leading-snug text-[#2C2420]">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-[#8B7B72]">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <span className="text-xs text-[#B0A098]">
                        Atualizado em{' '}
                        {new Date(post.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                      {post.views > 0 && (
                        <span className="flex items-center gap-1 text-xs text-[#B0A098]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.views} visualizações
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(post.id)}
                        className="rounded-xl bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3d6649]"
                      >
                        Publicar
                      </button>
                    )}
                    {post.status === 'published' && (
                      <>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="rounded-xl border border-[#E8E0DC] bg-white px-4 py-2 text-sm font-semibold text-[#2C2420] transition-colors hover:bg-[#F8F4F1]"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => handleArchive(post.id)}
                          className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-50"
                        >
                          Arquivar
                        </button>
                      </>
                    )}
                    <Link
                      href={`/profissional/blog/${post.id}/editar`}
                      className="rounded-xl border border-[#E8E0DC] bg-white px-4 py-2 text-sm font-semibold text-[#2C2420] transition-colors hover:bg-[#F8F4F1]"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="rounded-xl border border-rose-100 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
