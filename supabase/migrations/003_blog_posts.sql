-- ==================================================
-- TABELA: blog_posts
-- Posts/artigos do blog psicanalítico
-- ==================================================

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Autor do post (profissional)
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conteúdo
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image_url TEXT NULL,

  -- Status e metadados
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views INTEGER DEFAULT 0,

  -- Timestamps
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT non_empty_title CHECK (char_length(title) > 0),
  CONSTRAINT non_empty_slug CHECK (char_length(slug) > 0),
  CONSTRAINT non_empty_content CHECK (char_length(content) > 0)
);

-- ==================================================
-- ÍNDICES
-- ==================================================

CREATE INDEX idx_blog_posts_author_id
  ON public.blog_posts(author_id);

CREATE INDEX idx_blog_posts_status
  ON public.blog_posts(status);

CREATE INDEX idx_blog_posts_published_at
  ON public.blog_posts(published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_blog_posts_slug
  ON public.blog_posts(slug)
  WHERE status = 'published';

-- ==================================================
-- RLS (Row Level Security)
-- ==================================================

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver posts publicados
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
  FOR SELECT USING (status = 'published');

-- Autores podem ver seus próprios posts (incluindo rascunhos)
CREATE POLICY "Authors can view own posts" ON public.blog_posts
  FOR SELECT USING (auth.uid() = author_id);

-- Autores podem criar posts
CREATE POLICY "Authors can create posts" ON public.blog_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Autores podem atualizar seus próprios posts
CREATE POLICY "Authors can update own posts" ON public.blog_posts
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Autores podem deletar seus próprios posts
CREATE POLICY "Authors can delete own posts" ON public.blog_posts
  FOR DELETE USING (auth.uid() = author_id);

-- ==================================================
-- TRIGGER: Atualizar updated_at e published_at
-- ==================================================

CREATE OR REPLACE FUNCTION public.update_blog_posts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Se está sendo publicado agora, define published_at
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_blog_posts_timestamp
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_posts_timestamp();

-- ==================================================
-- STORAGE: Bucket para imagens do blog
-- Execute no Supabase Dashboard > Storage > New Bucket:
--   Nome: blog-images
--   Public: true
--
-- Depois adicione esta policy via SQL:
-- ==================================================

-- Políticas de Storage (executar separadamente se necessário)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Permitir upload para usuários autenticados
-- CREATE POLICY "Authenticated users can upload blog images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- Permitir leitura pública
-- CREATE POLICY "Public can view blog images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'blog-images');

-- Permitir delete pelo dono
-- CREATE POLICY "Users can delete own blog images"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);
