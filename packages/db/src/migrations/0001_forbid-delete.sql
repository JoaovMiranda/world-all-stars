-- Soft delete only (doc 03): a physical DELETE is a bug. Second barrier after the app role without DELETE grant.
CREATE OR REPLACE FUNCTION forbid_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Physical DELETE is forbidden on %: use soft delete (deleted_at)', TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint
-- Adds the trigger to every public table that does not have it yet. New migrations end with: SELECT protect_all_tables();
CREATE OR REPLACE FUNCTION protect_all_tables() RETURNS void LANGUAGE plpgsql AS $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND NOT EXISTS (SELECT 1 FROM pg_trigger g WHERE g.tgrelid = c.oid AND g.tgname = 'forbid_delete')
  LOOP
    EXECUTE format('CREATE TRIGGER forbid_delete BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION forbid_delete()', t.relname);
  END LOOP;
END;
$$;
--> statement-breakpoint
SELECT protect_all_tables();
