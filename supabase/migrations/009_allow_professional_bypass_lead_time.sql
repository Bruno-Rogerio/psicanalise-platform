-- ==================================================
-- Allow service_role (professional API) to bypass
-- the minimum lead time trigger for appointments
-- ==================================================

CREATE OR REPLACE FUNCTION public.enforce_min_appointment_lead_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role (professional creating sessions via API) bypasses this check
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.start_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT' OR NEW.start_at IS DISTINCT FROM OLD.start_at)
     AND NEW.status IN ('scheduled', 'rescheduled') THEN
    IF NEW.start_at < (now() + interval '4 hours') THEN
      RAISE EXCEPTION 'MIN_LEAD_TIME'
        USING ERRCODE = 'P0001',
              DETAIL = 'Appointments must be scheduled at least 4 hours in advance.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
