REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name,date_of_birth) ON public.profiles TO authenticated;