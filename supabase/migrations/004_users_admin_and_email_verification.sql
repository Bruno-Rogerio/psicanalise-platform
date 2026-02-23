-- ==================================================
-- Users admin fields + email verification
-- ==================================================

-- Add fields to profiles
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Status constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('active', 'blocked', 'pending_email'));
  END IF;
END $$;

-- Backfill email and status for existing users
UPDATE public.profiles p
SET email = COALESCE(p.email, u.email),
    status = COALESCE(p.status, 'active'),
    email_verified_at = COALESCE(p.email_verified_at, NOW())
FROM auth.users u
WHERE u.id = p.id;

UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_nome_lower ON public.profiles (lower(nome));
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash ON public.email_verifications(token_hash);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_verifications'
      AND policyname = 'Service role can manage email verifications'
  ) THEN
    CREATE POLICY "Service role can manage email verifications"
      ON public.email_verifications
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Index for availability blocks (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'availability_blocks'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_availability_blocks_profissional_start ON public.availability_blocks (profissional_id, start_at)';
  END IF;
END $$;
