-- Migration 008: tier em produtos/perfis e tabela de códigos promocionais

-- 1. Coluna tier nos produtos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'standard'
  CHECK (tier IN ('standard', 'popular'));

UPDATE products SET tier = 'standard';

-- 2. Coluna tier nos perfis
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'standard'
  CHECK (tier IN ('standard', 'popular'));

-- 3. Tabela de códigos promocionais
CREATE TABLE IF NOT EXISTS promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  profissional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by         UUID REFERENCES auth.users(id),
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profissional_select_promo_codes"
  ON promo_codes FOR SELECT
  USING (profissional_id = auth.uid());

CREATE POLICY "profissional_insert_promo_codes"
  ON promo_codes FOR INSERT
  WITH CHECK (profissional_id = auth.uid());

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_profissional_id ON promo_codes(profissional_id);
