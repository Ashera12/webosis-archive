-- Repair gallery id sequence (run only if id is bigint and duplicate / invalid sequence issues occur)
DO $$
DECLARE seq_name text; max_id bigint; needs_reset boolean; current_last bigint;
BEGIN
  -- Detect primary key sequence name heuristically
  SELECT pg_get_serial_sequence('public.gallery','id') INTO seq_name;
  IF seq_name IS NULL THEN
    RAISE NOTICE 'No serial sequence attached to gallery.id (maybe UUID PK). Skipping.';
    RETURN;
  END IF;

  SELECT COALESCE(MAX(id),0) INTO max_id FROM public.gallery;
  EXECUTE format('SELECT last_value FROM %s', seq_name) INTO current_last;
  needs_reset := current_last <= max_id;

  IF needs_reset THEN
    PERFORM setval(seq_name, max_id + 1, false);
    RAISE NOTICE 'Sequence % reset to %', seq_name, max_id + 1;
  ELSE
    RAISE NOTICE 'Sequence % already ahead (last_value=%, max_id=%). No reset needed.', seq_name, current_last, max_id;
  END IF;
END $$;
