CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id, role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.profiles ADD COLUMN email text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN banned boolean NOT NULL DEFAULT false;
UPDATE public.profiles p SET email = coalesce(u.email,'') FROM auth.users u WHERE u.id = p.id;
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.create_earnright_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles(id, display_name, email) VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Member'), coalesce(new.email,'')) ON CONFLICT (id) DO NOTHING;
IF lower(new.email) = 'norbidurac2910@gmail.com' THEN INSERT INTO public.user_roles(user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING; END IF;
RETURN new; END; $$;
INSERT INTO public.user_roles(user_id, role) SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'norbidurac2910@gmail.com' ON CONFLICT DO NOTHING;

CREATE TABLE public.offers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL DEFAULT '', category text NOT NULL CHECK (category IN ('game','video','task')), reward numeric(10,2) NOT NULL CHECK (reward > 0), link text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read active offers" ON public.offers FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert offers" ON public.offers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update offers" ON public.offers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete offers" ON public.offers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE, offer_title text NOT NULL, reward numeric(10,2) NOT NULL, proof text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz, UNIQUE(user_id, offer_id));
GRANT SELECT ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or admin submissions" ON public.submissions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.withdrawals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, amount numeric(10,2) NOT NULL CHECK (amount > 0), method text NOT NULL, details text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or admin withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE FUNCTION public.user_balance(_user uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT coalesce((SELECT sum(reward) FROM public.submissions WHERE user_id=_user AND status='approved'),0) - coalesce((SELECT sum(amount) FROM public.withdrawals WHERE user_id=_user AND status IN ('pending','approved')),0) $$;
REVOKE ALL ON FUNCTION public.user_balance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_balance(uuid) TO authenticated;

CREATE FUNCTION public.submit_offer(_offer uuid, _proof text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE o public.offers; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
SELECT * INTO o FROM public.offers WHERE id=_offer AND active; IF o.id IS NULL THEN RAISE EXCEPTION 'Offer not available'; END IF;
INSERT INTO public.submissions(user_id, offer_id, offer_title, reward, proof) VALUES (auth.uid(), o.id, o.title, o.reward, left(coalesce(_proof,''),500))
ON CONFLICT (user_id, offer_id) DO UPDATE SET proof=excluded.proof, status='pending', created_at=now(), reviewed_at=null WHERE public.submissions.status='rejected';
END; $$;
REVOKE ALL ON FUNCTION public.submit_offer(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_offer(uuid,text) TO authenticated;

CREATE FUNCTION public.request_withdrawal(_amount numeric, _method text, _details text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));
IF _amount IS NULL OR _amount < 1 THEN RAISE EXCEPTION 'Minimum withdrawal is 1.00'; END IF;
IF _amount > public.user_balance(auth.uid()) THEN RAISE EXCEPTION 'Amount is more than your balance'; END IF;
INSERT INTO public.withdrawals(user_id, amount, method, details) VALUES (auth.uid(), round(_amount,2), left(_method,40), left(_details,300));
END; $$;
REVOKE ALL ON FUNCTION public.request_withdrawal(numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric,text,text) TO authenticated;

CREATE FUNCTION public.review_submission(_id uuid, _approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
UPDATE public.submissions SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, reviewed_at=now() WHERE id=_id AND status='pending';
END; $$;
REVOKE ALL ON FUNCTION public.review_submission(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_submission(uuid,boolean) TO authenticated;

CREATE FUNCTION public.review_withdrawal(_id uuid, _approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
UPDATE public.withdrawals SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, reviewed_at=now() WHERE id=_id AND status='pending';
END; $$;
REVOKE ALL ON FUNCTION public.review_withdrawal(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_withdrawal(uuid,boolean) TO authenticated;

CREATE POLICY "Admins upload offer images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'offer-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete offer images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'offer-images' AND public.has_role(auth.uid(),'admin'));

COMMENT ON TABLE public.demo_activity IS 'DEPRECATED: replaced by offers/submissions';
COMMENT ON TABLE public.demo_sessions IS 'DEPRECATED: replaced by offers/submissions';