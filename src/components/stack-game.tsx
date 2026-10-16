import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { money } from '@/lib/links';
import poster from '@/assets/poster-stack.jpg';
import { X } from 'lucide-react';

const AD_URL = 'https://www.profitableratecpmnetwork.com/vwikgawy61?key=2733a9f76350db8589179208af49683e';
const W = 300, H = 420, BH = 22, BLOCKS_PER_LEVEL = 5;
type Block = { x: number; w: number };

function Game({ onReward }: { onReward: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({ stack: [{ x: 75, w: 150 }] as Block[], cur: { x: 0, w: 150 } as Block, dir: 1, speed: 2, over: false, paused: false });
  const [placed, setPlaced] = useState(0); const [over, setOver] = useState(false);
  const [claimLevel, setClaimLevel] = useState<number | null>(null); const [level, setLevel] = useState(1);
  const pending = useRef<number | null>(null);

  function reset() { st.current = { stack: [{ x: 75, w: 150 }], cur: { x: 0, w: 150 }, dir: 1, speed: 2, over: false, paused: false }; setPlaced(0); setOver(false); setClaimLevel(null); setLevel(1); }

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const s = st.current, c = canvas.current?.getContext('2d');
      if (!s.over && !s.paused) { s.cur.x += s.dir * s.speed; if (s.cur.x < 0 || s.cur.x + s.cur.w > W) s.dir *= -1; }
      if (c) {
        const dpr = window.devicePixelRatio || 1; const cv = c.canvas;
        if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2b2e33'); bg.addColorStop(1, '#14161a'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
        const off = Math.max(0, s.stack.length - 12) * BH;
        const block = (b: Block, y: number, i: number) => { const g = c.createLinearGradient(0, y, 0, y + BH); const l = 55 + (i % 5) * 7; g.addColorStop(0, `hsl(215 10% ${l + 18}%)`); g.addColorStop(1, `hsl(215 8% ${l - 10}%)`); c.fillStyle = g; c.beginPath(); c.roundRect(b.x, y, b.w, BH - 3, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(b.x + 4, y + 2, Math.max(0, b.w - 8), 2); };
        s.stack.forEach((b, i) => block(b, H - (i + 1) * BH + off, i));
        if (!s.over) block(s.cur, H - (s.stack.length + 1) * BH + off, s.stack.length);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, []);

  function drop() {
    const s = st.current; if (s.over || s.paused) return;
    const top = s.stack[s.stack.length - 1]!;
    const l = Math.max(top.x, s.cur.x), r = Math.min(top.x + top.w, s.cur.x + s.cur.w);
    if (r - l <= 0) { s.over = true; setOver(true); return; }
    s.stack.push({ x: l, w: r - l }); s.cur = { x: 0, w: r - l }; s.speed = Math.min(6, s.speed + 0.2);
    const n = s.stack.length - 1; setPlaced(n);
    if (n % BLOCKS_PER_LEVEL === 0) { s.paused = true; setClaimLevel(n / BLOCKS_PER_LEVEL); }
  }

  async function claim() {
    if (claimLevel == null) return;
    const win = window.open(AD_URL, '_blank', 'noopener');
    const { error } = await supabase.rpc('start_game_claim', { _level: claimLevel });
    if (error) { toast.error(error.message); win?.close(); return; }
    pending.current = claimLevel; toast('Watch the ad for 3 seconds, then come back to collect.');
  }
  function skip() { st.current.paused = false; setLevel(l => l + 1); setClaimLevel(null); }

  useEffect(() => {
    async function back() {
      if (document.visibilityState !== 'visible' || pending.current == null) return;
      const lv = pending.current;
      const { data, error } = await supabase.rpc('claim_game_reward', { _level: lv });
      if (error) { toast.error(error.message.includes('3 seconds') ? 'Watch the ad for at least 3 seconds — press claim again.' : error.message); if (!error.message.includes('3 seconds')) pending.current = null; return; }
      pending.current = null; toast.success(`+${money(Number(data))} for level ${lv}`); onReward(); skip();
    }
    document.addEventListener('visibilitychange', back); window.addEventListener('focus', back);
    return () => { document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back); };
  }, [onReward]);

  return <section className="stack-game stack-screen"><h2>Stack & earn.</h2><p>Stack {BLOCKS_PER_LEVEL} blocks to pass a level, then claim your reward. Tap the board to drop.</p>
    <div className="stack-hud"><span>Level {level}</span><span>{placed} blocks</span></div>
    <canvas ref={canvas} className="stack-canvas" onClick={drop} onKeyDown={e => e.key === ' ' && drop()} tabIndex={0} aria-label="Stack game board" />
    {claimLevel != null && <div className="stack-overlay"><strong>Level {claimLevel} passed!</strong><Button variant="ink" onClick={claim}>Claim reward</Button><Button variant="ghost" onClick={skip}>Keep playing</Button></div>}
    {over && <div className="stack-overlay"><strong>Game over</strong><Button variant="ink" onClick={reset}>Play again</Button></div>}
  </section>;
}

export function StackGame({ onReward }: { onReward: () => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="stack-poster" onClick={() => setOpen(true)}><img src={poster} alt="Stack game poster" width={768} height={960} loading="lazy" /><span><strong>Stack & earn</strong>Tap to play</span></button>
    {open && <div className="stack-modal"><button type="button" className="stack-close" aria-label="Close game" onClick={() => setOpen(false)}><X /></button><Game onReward={onReward} /></div>}
  </>;
}
