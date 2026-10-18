ALTER TABLE public.reward_events ADD COLUMN claimed_at timestamptz;
UPDATE public.reward_events SET claimed_at = started_at WHERE claimed AND claimed_at IS NULL;
ALTER TABLE public.reward_events DROP CONSTRAINT reward_events_kind_check;
ALTER TABLE public.reward_events ADD CONSTRAINT reward_events_kind_check CHECK (kind IN ('stack','admin','box'));
CREATE UNIQUE INDEX one_pending_box ON public.reward_events(user_id) WHERE kind='box' AND NOT claimed;
CREATE OR REPLACE FUNCTION public.start_box_claim() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid := auth.uid(); BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(caller::text || ':box',0));
IF EXISTS (SELECT 1 FROM public.reward_events WHERE user_id=caller AND kind='box' AND claimed AND now()-claimed_at < interval '10 minutes') THEN RAISE EXCEPTION 'Your next box is still cooling down'; END IF;
INSERT INTO public.reward_events(user_id,kind,reward) VALUES (caller,'box',round((0.05 + random()*0.05)::numeric,2)) ON CONFLICT (user_id) WHERE kind='box' AND NOT claimed DO UPDATE SET started_at=now();
END; $$;
CREATE OR REPLACE FUNCTION public.claim_box_reward() RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid := auth.uid(); g public.reward_events; BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(caller::text || ':box',0));
SELECT * INTO g FROM public.reward_events WHERE user_id=caller AND kind='box' AND NOT claimed FOR UPDATE;
IF g.id IS NULL THEN RAISE EXCEPTION 'Open the box first'; END IF;
IF now()-g.started_at < interval '5 seconds' THEN RAISE EXCEPTION 'Visit the offer for at least 5 seconds'; END IF;
UPDATE public.reward_events SET claimed=true, claimed_at=now() WHERE id=g.id;
RETURN g.reward;
END; $$;
CREATE OR REPLACE FUNCTION public.box_status() RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT json_build_object(
 'has_pending', EXISTS (SELECT 1 FROM public.reward_events WHERE user_id=auth.uid() AND kind='box' AND NOT claimed),
 'wait_seconds', GREATEST(0, COALESCE((EXTRACT(EPOCH FROM ((SELECT max(claimed_at) FROM public.reward_events WHERE user_id=auth.uid() AND kind='box' AND claimed) + interval '10 minutes' - now()))::int), 0))
) $$;
REVOKE ALL ON FUNCTION public.start_box_claim(), public.claim_box_reward(), public.box_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_box_claim(), public.claim_box_reward(), public.box_status() TO authenticated;