'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import {
  getPostById,
  updatePost,
  publishPost,
  generateSlug,
  isSlugAvailable,
} from '@/services/blog';
import { MarkdownEditor, ImageUploader } from '@/components/blog';
import type { BlogPost } from '@/types/blog';

export default function EditarPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id) setAuthorId(auth.user.id);

      const data = await getPostById(postId);
      if (!data) {
        router.push('/profissional/blog');
        return;
      }

      setPost(data);
      setTitle(data.title);
      setSlug(data.slug);
      setExcerpt(data.excerpt);
      setContent(data.content);
      setFeaturedImageUrl(data.featured_image_url);
    } catch (err) {
      console.error('Erro ao carregar post:', err);
      setError('Erro ao carregar o post');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError(null);

    if (!title.trim()) {
      setError('Digite um título');
      return;
    }
    if (!excerpt.trim()) {
      setError('Digite um resumo');
      return;
    }
    if (!content.trim()) {
      setError('Digite o conteúdo');
      return;
    }

    const finalSlug = slug || generateSlug(title);

    // Verifica se slug está disponível (excluindo o post atual)
    const available = await isSlugAvailable(finalSlug, postId);
    if (!available) {
      setError('Este slug já está em uso. Escolha outro.');
      return;
    }

    try {
      setSaving(true);

      await updatePost(postId, {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content: content.trim(),
        featured_image_url: featuredImageUrl,
      });

      router.push('/profissional/blog');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar o post');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    await handleSave();
    if (!error) {
      try {
        await publishPost(postId);
      } catch (err) {
        console.error('Erro ao publicar:', err);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-warm-200 border-t-sage-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-warm-600">Post não encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/profissional/blog"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 transition-colors hover:bg-warm-100"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-warm-900">
              Editar post
            </h1>
            <p className="text-sm text-warm-500">
              Status:{' '}
              <span
                className={
                  post.status === 'published'
                    ? 'text-sage-600'
                    : post.status === 'archived'
                    ? 'text-rose-600'
                    : 'text-warm-600'
                }
              >
                {post.status === 'published'
                  ? 'Publicado'
                  : post.status === 'archived'
                  ? 'Arquivado'
                  : 'Rascunho'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl border border-warm-300 bg-white px-5 py-2.5 text-sm font-semibold text-warm-700 transition-all hover:border-warm-400 hover:shadow-soft disabled:opacity-50"
          >
            Salvar
          </button>
          {post.status !== 'published' && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-sage-700 hover:shadow-soft-lg disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Publicar'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Formulário */}
      <div className="space-y-6 rounded-2xl border border-warm-200 bg-white p-6 shadow-soft">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-warm-700">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do post"
            className="mt-2 w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 placeholder-warm-400 transition-colors focus:border-sage-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-warm-700">
            Slug (URL)
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-warm-500">/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
              }
              placeholder="url-do-post"
              className="flex-1 rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 placeholder-warm-400 transition-colors focus:border-sage-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-200"
            />
          </div>
        </div>

        {/* Resumo */}
        <div>
          <label className="block text-sm font-medium text-warm-700">
            Resumo
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Uma breve descrição que aparecerá na listagem"
            rows={3}
            className="mt-2 w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-warm-900 placeholder-warm-400 transition-colors focus:border-sage-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
        </div>

        {/* Imagem de capa */}
        {authorId && (
          <ImageUploader
            value={featuredImageUrl}
            onChange={setFeaturedImageUrl}
            authorId={authorId}
          />
        )}

        {/* Conteúdo */}
        <div>
          <label className="mb-2 block text-sm font-medium text-warm-700">
            Conteúdo
          </label>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
