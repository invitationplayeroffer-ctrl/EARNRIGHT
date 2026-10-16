CREATE TABLE public.game_rewards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, level int NOT NULL CHECK (level BETWEEN 1 AND 100), day date NOT NULL DEFAULT current_date, started_at timestamptz NOT NULL DEFAULT now(), claimed boolean NOT NULL DEFAULT false, reward numeric(10,2) NOT NULL DEFAULT 0.01, UNIQUE(user_id, level, day));
GRANT SELECT ON public.game_rewards TO authenticated;
GRANT ALL ON public.game_rewards TO service_role;
ALTER TABLE public.game_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or admin game rewards" ON public.game_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.user_balance(_user uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT coalesce((SELECT sum(reward) FROM public.submissions WHERE user_id=_user AND status='approved'),0)
 + coalesce((SELECT sum(reward) FROM public.game_rewards WHERE user_id=_user AND claimed),0)
 - coalesce((SELECT sum(amount) FROM public.withdrawals WHERE user_id=_user AND status IN ('pending','approved')),0) $$;

CREATE FUNCTION public.start_game_claim(_level int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller uuid := auth.uid(); BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
IF _level < 1 OR _level > 100 THEN RAISE EXCEPTION 'Invalid level'; END IF;
IF _level > 1 AND NOT EXISTS (SELECT 1 FROM public.game_rewards WHERE user_id=caller AND day=current_date AND level=_level-1 AND claimed) THEN RAISE EXCEPTION 'Claim the previous level first'; END IF;
INSERT INTO public.game_rewards(user_id, level) VALUES (caller, _level)
ON CONFLICT (user_id, level, day) DO UPDATE SET started_at=now() WHERE NOT public.game_rewards.claimed;
END; $$;
REVOKE ALL ON FUNCTION public.start_game_claim(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_game_claim(int) TO authenticated;

CREATE FUNCTION public.claim_game_reward(_level int) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller uuid := auth.uid(); g public.game_rewards; BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
SELECT * INTO g FROM public.game_rewards WHERE user_id=caller AND level=_level AND day=current_date FOR UPDATE;
IF g.id IS NULL THEN RAISE EXCEPTION 'Press claim first'; END IF;
IF g.claimed THEN RAISE EXCEPTION 'Already claimed today'; END IF;
IF now() - g.started_at < interval '3 seconds' THEN RAISE EXCEPTION 'Watch the ad for at least 3 seconds'; END IF;
UPDATE public.game_rewards SET claimed=true WHERE id=g.id;
RETURN g.reward;
END; $$;
REVOKE ALL ON FUNCTION public.claim_game_reward(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_game_reward(int) TO authenticated;