ALTER TABLE public.profiles ALTER COLUMN signup_bonus SET DEFAULT 5;
CREATE TABLE public.reward_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, kind text NOT NULL CHECK (kind IN ('stack','admin')), level int CHECK (level >= 1), reward numeric(10,2) NOT NULL CHECK (reward > 0), started_at timestamptz NOT NULL DEFAULT now(), claimed boolean NOT NULL DEFAULT false, awarded_by uuid REFERENCES public.profiles(id), request_id uuid UNIQUE);
GRANT SELECT ON public.reward_events TO authenticated;
GRANT ALL ON public.reward_events TO service_role;
ALTER TABLE public.reward_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin reward history" ON public.reward_events FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX one_pending_stack_claim ON public.reward_events(user_id) WHERE kind='stack' AND NOT claimed;
CREATE OR REPLACE FUNCTION public.start_game_claim(_level int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid := auth.uid(); BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
IF _level IS NULL OR _level < 1 THEN RAISE EXCEPTION 'Invalid level'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(caller::text || ':stack',0));
INSERT INTO public.reward_events(user_id,kind,level,reward) VALUES (caller,'stack',_level,0.01) ON CONFLICT (user_id) WHERE kind='stack' AND NOT claimed DO NOTHING;
END; $$;
CREATE OR REPLACE FUNCTION public.claim_game_reward(_level int) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid := auth.uid(); g public.reward_events; BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(caller::text || ':stack',0));
SELECT * INTO g FROM public.reward_events WHERE user_id=caller AND kind='stack' AND NOT claimed FOR UPDATE;
IF g.id IS NULL THEN RAISE EXCEPTION 'Press claim first'; END IF;
IF now()-g.started_at < interval '3 seconds' THEN RAISE EXCEPTION 'Watch the ad for at least 3 seconds'; END IF;
UPDATE public.reward_events SET claimed=true WHERE id=g.id;
RETURN g.reward;
END; $$;
REVOKE ALL ON FUNCTION public.start_game_claim(int), public.claim_game_reward(int) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.start_game_claim(int), public.claim_game_reward(int) TO authenticated;
CREATE FUNCTION public.award_user_bonus(_user uuid, _request uuid) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
IF _request IS NULL THEN RAISE EXCEPTION 'Missing request'; END IF;
IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=_user) THEN RAISE EXCEPTION 'Player not found'; END IF;
INSERT INTO public.reward_events(user_id,kind,reward,claimed,awarded_by,request_id) VALUES (_user,'admin',10,true,auth.uid(),_request) ON CONFLICT (request_id) DO NOTHING;
RETURN 10;
END; $$;
REVOKE ALL ON FUNCTION public.award_user_bonus(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.award_user_bonus(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.user_balance(_user uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT CASE WHEN auth.uid()=_user OR public.has_role(auth.uid(),'admin') THEN
coalesce((SELECT signup_bonus FROM public.profiles WHERE id=_user),0)
+ coalesce((SELECT sum(reward) FROM public.submissions WHERE user_id=_user AND status='approved'),0)
+ coalesce((SELECT sum(reward) FROM public.game_rewards WHERE user_id=_user AND claimed),0)
+ coalesce((SELECT sum(reward) FROM public.reward_events WHERE user_id=_user AND claimed),0)
- coalesce((SELECT sum(amount) FROM public.withdrawals WHERE user_id=_user AND status IN ('pending','approved')),0)
ELSE NULL END $$;