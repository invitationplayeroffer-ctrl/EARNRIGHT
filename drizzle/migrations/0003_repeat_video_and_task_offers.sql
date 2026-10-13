ALTER TABLE public.submissions DROP CONSTRAINT submissions_user_id_offer_id_key;
CREATE INDEX submissions_user_offer_idx ON public.submissions(user_id, offer_id);
CREATE OR REPLACE FUNCTION public.submit_offer(_offer uuid, _proof text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.offers; previous public.submissions; caller uuid := auth.uid();
BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtext(caller::text), hashtext(_offer::text));
SELECT * INTO o FROM public.offers WHERE id=_offer AND active FOR SHARE;
IF o.id IS NULL THEN RAISE EXCEPTION 'Offer not available'; END IF;
IF o.category NOT IN ('task','video') THEN
SELECT * INTO previous FROM public.submissions WHERE user_id=caller AND offer_id=o.id ORDER BY CASE WHEN status IN ('pending','approved') THEN 0 ELSE 1 END, created_at DESC LIMIT 1 FOR UPDATE;
IF previous.id IS NOT NULL THEN
IF previous.status <> 'rejected' THEN RAISE EXCEPTION 'This offer can only be completed once'; END IF;
UPDATE public.submissions SET proof=left(coalesce(_proof,''),500), status='pending', created_at=now(), reviewed_at=NULL WHERE id=previous.id;
RETURN;
END IF;
END IF;
INSERT INTO public.submissions(user_id,offer_id,offer_title,reward,proof) VALUES (caller,o.id,o.title,o.reward,left(coalesce(_proof,''),500));
END; $$;
REVOKE ALL ON FUNCTION public.submit_offer(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_offer(uuid,text) TO authenticated;