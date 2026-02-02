import { supabase } from '@/lib/supabase-browser';
import type { BlogPost, BlogPostInsert, BlogPostUpdate, PostStatus } from '@/types/blog';

/**
 * Gera slug a partir do título
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

/**
 * Lista posts publicados (público)
 */
export async function listPublishedPosts(
  limit: number = 20,
  offset: number = 0
): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []) as BlogPost[];
}

/**
 * Busca post por slug (público)
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Incrementar views em background
  if (data) {
    supabase
      .from('blog_posts')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id)
      .then(() => {});
  }

  return data as BlogPost;
}

/**
 * Lista posts do autor (admin)
 */
export async function listAuthorPosts(
  authorId: string,
  status?: PostStatus
): Promise<BlogPost[]> {
  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('author_id', authorId)
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BlogPost[];
}

/**
 * Busca post por ID (admin)
 */
export async function getPostById(postId: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as BlogPost;
}

/**
 * Cria novo post
 */
export async function createPost(post: BlogPostInsert): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      author_id: post.author_id,
      title: post.title,
      slug: post.slug || generateSlug(post.title),
      excerpt: post.excerpt,
      content: post.content,
      featured_image_url: post.featured_image_url || null,
      status: post.status || 'draft',
      views: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as BlogPost;
}

/**
 * Atualiza post
 */
export async function updatePost(
  postId: string,
  updates: BlogPostUpdate
): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as BlogPost;
}

/**
 * Publica um post
 */
export async function publishPost(postId: string): Promise<BlogPost> {
  return updatePost(postId, { status: 'published' });
}

/**
 * Arquiva um post
 */
export async function archivePost(postId: string): Promise<BlogPost> {
  return updatePost(postId, { status: 'archived' });
}

/**
 * Deleta um post permanentemente
 */
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

/**
 * Verifica se slug já existe
 */
export async function isSlugAvailable(
  slug: string,
  excludePostId?: string
): Promise<boolean> {
  let query = supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug);

  if (excludePostId) {
    query = query.neq('id', excludePostId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return !data || data.length === 0;
}
