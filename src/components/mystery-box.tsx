import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { money } from '@/lib/links';
import { OFFER_AD_URL, BOX_MIN, BOX_MAX, BOX_WAIT_SECONDS, BOX_COOLDOWN_MINUTES } from '@/lib/reward-rules';
import { sfx, soundOn, setSoundOn } from '@/lib/sfx';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function MysteryBox({ onReward }: { onReward: () => void }) {
  const [open, setOpen] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const [wait, setWait] = useState(0);
  const [how, setHow] = useState(false);
  const [sound, setSound] = useState(true);
  const pending = useRef(false);

  const sync = useCallback(async () => {
    const { data, error } = await supabase.rpc('box_status');
    if (error || !data) return;
    const s = data as { has_pending?: boolean; wait_seconds?: number };
    setAwaiting(!!s.has_pending);
    setWait(Math.max(0, Number(s.wait_seconds ?? 0)));
  }, []);

  const collect = useCallback(async () => {
    if (!pending.current) return;
    pending.current = false;
    const { data, error } = await supabase.rpc('claim_box_reward');
    if (error) {
      if (error.message.includes('at least')) {
        pending.current = true;
        toast.error(`Stay on the offer page for ${BOX_WAIT_SECONDS} seconds, then come back here.`);
      } else {
        toast.error(error.message);
      }
      void sync();
      return;
    }
    const amount = Number(data);
    setAwaiting(false); setOpen(true); setWon(amount);
    sfx.boxOpen();
    toast.success(`Box opened — ${money(amount)} added to your balance`);
    onReward();
    void sync();
  }, [onReward, sync]);

  useEffect(() => {
    void sync();
    setSound(soundOn());
    const t = window.setInterval(() => setWait(w => (w > 0 ? w - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [sync]);

  useEffect(() => {
    const back = () => { if (document.visibilityState === 'visible') void collect(); };
    document.addEventListener('visibilitychange', back);
    window.addEventListener('focus', back);
    return () => { document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back); };
  }, [collect]);

  async function tap() {
    if (busy) return;
    sfx.tap();
    if (wait > 0) { toast(`Your next box opens in ${fmt(wait)}`); return; }
    const win = window.open(OFFER_AD_URL, '_blank');
    if (!win) { toast.error('Allow pop-ups so the offer can open.'); return; }
    win.opener = null;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('start_box_claim');
      if (error) { toast.error(error.message); win.close(); void sync(); return; }
      pending.current = true;
      setAwaiting(true); setWon(null); setOpen(false);
      toast(`Stay on the offer page for ${BOX_WAIT_SECONDS} seconds, then come back here to open your box.`);
    } finally { setBusy(false); }
  }

  return <section className="box-section">
    <div className="box-head">
      <div><span className="eyebrow">MYSTERY BOX</span><h2>Open a box. See what&rsquo;s inside.</h2><p>Every box pays something between {money(BOX_MIN)} and {money(BOX_MAX)}. Visit the offer, come back, and it&rsquo;s yours.</p></div>
      <div className="box-tools">
        <Button variant="ghost" size="icon" aria-label="How the box works" onClick={() => { sfx.tap(); setHow(true); }}><HelpCircle /></Button>
        <Button variant="ghost" size="icon" aria-label={sound ? 'Turn sounds off' : 'Turn sounds on'} onClick={() => { const n = !sound; setSound(n); setSoundOn(n); if (n) sfx.tap(); }}>{sound ? <Volume2 /> : <VolumeX />}</Button>
      </div>
    </div>
    <div className="box-stage">
      <button type="button" className={`box-3d ${open ? 'is-open' : ''} ${awaiting ? 'is-waiting' : ''}`} onClick={tap} aria-label="Open the mystery box">
        <span className="box-cube">
          <span className="box-face bf-front" /><span className="box-face bf-back" /><span className="box-face bf-right" /><span className="box-face bf-left" /><span className="box-face bf-bottom" />
          <span className="box-inside" />
          <span className="box-lid"><span className="box-lid-inner"><span className="box-ribbon" /><span className="box-question">?</span></span></span>
          <span className="box-glow" />
        </span>
      </button>
      <div className="box-panel">
        {won != null ? <><strong className="box-won">+{money(won)}</strong><p>Added to your balance. Your next box opens in {fmt(wait)}.</p></>
          : awaiting ? <><strong>The offer is open</strong><p>Stay on that page for at least {BOX_WAIT_SECONDS} seconds, then come back here — the box opens by itself.</p><Button variant="ink" onClick={() => void collect()}>I&rsquo;m back — open my box</Button></>
          : wait > 0 ? <><strong>Box cooling down</strong><p>Your next box opens in {fmt(wait)}.</p></>
            : <><strong>Ready when you are</strong><p>Tap the box. The offer opens in a new tab for {BOX_WAIT_SECONDS} seconds, then come back to collect.</p></>}
      </div>
    </div>
    {how && <div className="modal-backdrop" onClick={() => setHow(false)}><div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-label="How the box works"><h3>How the box works</h3><ol className="box-steps"><li>Tap the box &mdash; the offer opens in a new tab.</li><li>Stay on that page for at least {BOX_WAIT_SECONDS} seconds.</li><li>Come back here and the box opens with your reward ({money(BOX_MIN)}&ndash;{money(BOX_MAX)}).</li><li>The box then rests for {BOX_COOLDOWN_MINUTES} minutes before you can open another.</li></ol><Button variant="ghost" onClick={() => setHow(false)}>Got it</Button></div></div>}
  </section>;
}
