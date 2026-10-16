ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_bonus numeric(10,2) NOT NULL DEFAULT 10;
CREATE OR REPLACE FUNCTION public.user_balance(_user uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT coalesce((SELECT signup_bonus FROM public.profiles WHERE id=_user),0)
 + coalesce((SELECT sum(reward) FROM public.submissions WHERE user_id=_user AND status='approved'),0)
 + coalesce((SELECT sum(reward) FROM public.game_rewards WHERE user_id=_user AND claimed),0)
 - coalesce((SELECT sum(amount) FROM public.withdrawals WHERE user_id=_user AND status IN ('pending','approved')),0) $$;
CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text, _details text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));
IF _amount IS NULL OR _amount < 20 THEN RAISE EXCEPTION 'Minimum cash out is $20.00'; END IF;
IF _amount > public.user_balance(auth.uid()) THEN RAISE EXCEPTION 'Amount is more than your balance'; END IF;
INSERT INTO public.withdrawals(user_id, amount, method, details) VALUES (auth.uid(), round(_amount,2), left(_method,40), left(_details,300));
END; $$;