REVOKE EXECUTE ON FUNCTION public.set_default_group() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_group_delete_in_use() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.current_user_is_admin() FROM anon;