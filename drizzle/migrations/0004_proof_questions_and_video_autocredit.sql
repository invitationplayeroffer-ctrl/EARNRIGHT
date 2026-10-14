ALTER TABLE public.offers ADD COLUMN proof_question text NOT NULL DEFAULT '';
ALTER TABLE public.offers ADD COLUMN require_screenshot boolean NOT NULL DEFAULT false;
ALTER TABLE public.offers ADD COLUMN watch_seconds integer NOT NULL DEFAULT 30;
ALTER TABLE public.submissions ADD COLUMN screenshot_path text NOT NULL DEFAULT '';

CREATE TABLE public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  claimed boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.video_views TO authenticated;
GRANT ALL ON public.video_views TO service_role;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own video views" ON public.video_views FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX video_views_user_offer_idx ON public.video_views(user_id, offer_id, started_at DESC);

CREATE OR REPLACE FUNCTION public.submit_proof(_offer uuid, _answer text, _screenshot text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.offers; previous public.submissions; caller uuid := auth.uid(); shot text := coalesce(_screenshot,'');
BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtext(caller::text), hashtext(_offer::text));
SELECT * INTO o FROM public.offers WHERE id=_offer AND active FOR SHARE;
IF o.id IS NULL THEN RAISE EXCEPTION 'Offer not available'; END IF;
IF o.category = 'video' THEN RAISE EXCEPTION 'Videos are credited automatically'; END IF;
IF shot <> '' AND shot NOT LIKE caller::text || '/%' THEN RAISE EXCEPTION 'Invalid screenshot'; END IF;
IF o.require_screenshot AND shot = '' THEN RAISE EXCEPTION 'Please upload a screenshot'; END IF;
IF o.proof_question <> '' AND length(trim(coalesce(_answer,''))) = 0 THEN RAISE EXCEPTION 'Please answer the question'; END IF;
SELECT * INTO previous FROM public.submissions WHERE user_id=caller AND offer_id=o.id ORDER BY CASE WHEN status IN ('pending','approved') THEN 0 ELSE 1 END, created_at DESC LIMIT 1 FOR UPDATE;
IF previous.id IS NOT NULL THEN
  IF previous.status <> 'rejected' THEN RAISE EXCEPTION 'This offer can only be completed once'; END IF;
  UPDATE public.submissions SET proof=left(coalesce(_answer,''),500), screenshot_path=shot, status='pending', created_at=now(), reviewed_at=NULL WHERE id=previous.id;
  RETURN;
END IF;
INSERT INTO public.submissions(user_id,offer_id,offer_title,reward,proof,screenshot_path) VALUES (caller,o.id,o.title,o.reward,left(coalesce(_answer,''),500),shot);
END; $$;
REVOKE ALL ON FUNCTION public.submit_proof(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_proof(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_offer(_offer uuid, _proof text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.submit_proof(_offer, _proof, ''); END; $$;
COMMENT ON FUNCTION public.submit_offer(uuid,text) IS 'DEPRECATED: replaced by submit_proof';

CREATE OR REPLACE FUNCTION public.start_video(_offer uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller uuid := auth.uid();
BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
IF NOT EXISTS (SELECT 1 FROM public.offers WHERE id=_offer AND active AND category='video') THEN RAISE EXCEPTION 'Video not available'; END IF;
INSERT INTO public.video_views(user_id, offer_id) VALUES (caller, _offer);
END; $$;
REVOKE ALL ON FUNCTION public.start_video(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_video(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_video(_offer uuid) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller uuid := auth.uid(); o public.offers; v public.video_views;
BEGIN
IF caller IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
IF EXISTS (SELECT 1 FROM public.profiles WHERE id=caller AND banned) THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
PERFORM pg_advisory_xact_lock(hashtext(caller::text), hashtext(_offer::text));
SELECT * INTO o FROM public.offers WHERE id=_offer AND active AND category='video';
IF o.id IS NULL THEN RAISE EXCEPTION 'Video not available'; END IF;
SELECT * INTO v FROM public.video_views WHERE user_id=caller AND offer_id=_offer AND NOT claimed ORDER BY started_at DESC LIMIT 1 FOR UPDATE;
IF v.id IS NULL THEN RAISE EXCEPTION 'Open the video first'; END IF;
IF now() - v.started_at < make_interval(secs => o.watch_seconds) THEN RAISE EXCEPTION 'Watch for at least % seconds to earn', o.watch_seconds; END IF;
UPDATE public.video_views SET claimed=true WHERE user_id=caller AND offer_id=_offer AND NOT claimed;
INSERT INTO public.submissions(user_id,offer_id,offer_title,reward,proof,status,reviewed_at) VALUES (caller,o.id,o.title,o.reward,'Auto-credited video view','approved',now());
RETURN o.reward;
END; $$;
REVOKE ALL ON FUNCTION public.claim_video(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_video(uuid) TO authenticated;

CREATE POLICY "Members upload own proof" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='proof-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read own or admin proof" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='proof-screenshots' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));