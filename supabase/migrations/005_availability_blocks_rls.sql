-- ==================================================
-- Availability blocks RLS
-- ==================================================

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'availability_blocks'
      AND policyname = 'Authenticated can view availability blocks'
  ) THEN
    CREATE POLICY "Authenticated can view availability blocks"
      ON public.availability_blocks
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'availability_blocks'
      AND policyname = 'Professional can manage own blocks'
  ) THEN
    CREATE POLICY "Professional can manage own blocks"
      ON public.availability_blocks
      FOR ALL
      USING (auth.uid() = profissional_id)
      WITH CHECK (auth.uid() = profissional_id);
  END IF;
END $$;
