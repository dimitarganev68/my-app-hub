DROP POLICY IF EXISTS "Temporary open read" ON public.app_users;
DROP POLICY IF EXISTS "Temporary open insert" ON public.app_users;
DROP POLICY IF EXISTS "Temporary open update" ON public.app_users;
DROP POLICY IF EXISTS "Temporary open delete" ON public.app_users;
REVOKE ALL ON public.app_users FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO authenticated;
CREATE POLICY "Signed-in read" ON public.app_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in insert" ON public.app_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Signed-in update" ON public.app_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in delete" ON public.app_users FOR DELETE TO authenticated USING (true);

CREATE TABLE public.groups (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in insert" ON public.groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Signed-in update" ON public.groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in delete" ON public.groups FOR DELETE TO authenticated USING (true);
CREATE TRIGGER groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();