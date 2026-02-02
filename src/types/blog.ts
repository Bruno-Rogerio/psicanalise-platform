export type PostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  status: PostStatus;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostInsert {
  author_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url?: string | null;
  status?: PostStatus;
}

export interface BlogPostUpdate {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string | null;
  status?: PostStatus;
}
