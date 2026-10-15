INSERT INTO public.groups (name, comment)
SELECT v.name, v.comment FROM (VALUES ('normal','Нормален потребител'),('custom','Потребител с настройки'),('admin','Администратор')) v(name, comment)
WHERE NOT EXISTS (SELECT 1 FROM public.groups g WHERE g.name = v.name);

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u JOIN public.groups g ON g.id = (u.raw_app_meta_data->>'groupID')::int
    WHERE u.id = auth.uid() AND g.name = 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.current_user_is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_default_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_app_meta_data->>'groupID' IS NULL THEN
    NEW.raw_app_meta_data := coalesce(NEW.raw_app_meta_data,'{}'::jsonb)
      || jsonb_build_object('groupID', (SELECT id FROM public.groups WHERE name='normal'));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER set_default_group BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.set_default_group();

CREATE OR REPLACE FUNCTION public.prevent_group_delete_in_use()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE (raw_app_meta_data->>'groupID')::int = OLD.id) THEN
    RAISE EXCEPTION 'GROUP_IN_USE';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER prevent_group_delete_in_use BEFORE DELETE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.prevent_group_delete_in_use();

UPDATE auth.users SET raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb)
  || jsonb_build_object('groupID', (SELECT id FROM public.groups WHERE name='normal'));
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data
  || jsonb_build_object('groupID', (SELECT id FROM public.groups WHERE name='admin'))
WHERE id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

DROP POLICY IF EXISTS "Signed-in insert" ON public.groups;
DROP POLICY IF EXISTS "Signed-in update" ON public.groups;
DROP POLICY IF EXISTS "Signed-in delete" ON public.groups;
CREATE POLICY "Admin insert" ON public.groups FOR INSERT TO authenticated WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Admin update" ON public.groups FOR UPDATE TO authenticated USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Admin delete" ON public.groups FOR DELETE TO authenticated USING (public.current_user_is_admin());