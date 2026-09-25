DO $$
BEGIN
  IF to_regclass('public.sensor_readings') IS NULL THEN
    RAISE EXCEPTION 'Expected public.sensor_readings table was not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sensor_readings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings';
  END IF;
END $$;