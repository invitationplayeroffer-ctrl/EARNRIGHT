ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
CREATE OR REPLACE FUNCTION public.create_earnright_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _dob date;
BEGIN
BEGIN _dob := nullif(new.raw_user_meta_data->>'date_of_birth','')::date; EXCEPTION WHEN others THEN _dob := NULL; END;
INSERT INTO public.profiles(id, display_name, email, date_of_birth) VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Member'), coalesce(new.email,''), _dob) ON CONFLICT (id) DO NOTHING;
IF lower(new.email) = 'norbidurac2910@gmail.com' THEN INSERT INTO public.user_roles(user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING; END IF;
RETURN new; END; $$;