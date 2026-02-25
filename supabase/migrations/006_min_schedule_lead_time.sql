-- ==================================================
-- ENFORCE MINIMUM LEAD TIME FOR APPOINTMENTS
-- ==================================================

CREATE OR REPLACE FUNCTION public.enforce_min_appointment_lead_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enforce when scheduling or rescheduling (start_at changed)
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

DROP TRIGGER IF EXISTS trg_enforce_min_appointment_lead_time ON public.appointments;
CREATE TRIGGER trg_enforce_min_appointment_lead_time
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_min_appointment_lead_time();
