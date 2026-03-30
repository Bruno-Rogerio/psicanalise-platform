-- Migration: 007_payment_links.sql
-- Tabela para links de pagamento gerados pelo profissional via Stripe

CREATE TABLE IF NOT EXISTS payment_links (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description               TEXT NOT NULL,
  amount_cents              INTEGER NOT NULL CHECK (amount_cents >= 100),
  stripe_price_id           TEXT,
  stripe_payment_link_id    TEXT,
  url                       TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'cancelled')),
  stripe_checkout_session_id TEXT,
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Profissional vê apenas seus próprios links
CREATE POLICY "profissional_select_own_payment_links"
  ON payment_links FOR SELECT
  USING (profissional_id = auth.uid());

-- Profissional cria via service role (API route)
-- Sem policy de INSERT para usuário direto — apenas service role escreve

-- Webhook (service role) pode atualizar status
CREATE POLICY "webhook_update_payment_links"
  ON payment_links FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX idx_payment_links_profissional_id ON payment_links(profissional_id);
CREATE INDEX idx_payment_links_stripe_payment_link_id ON payment_links(stripe_payment_link_id);
