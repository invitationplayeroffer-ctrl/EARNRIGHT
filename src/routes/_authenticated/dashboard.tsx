import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowUpRight, LayoutGrid, Gamepad2, Play, ListChecks, Wallet, History, LogOut, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { SocialLinks } from '@/components/social-links';
import { dashboardOptions } from '@/lib/earnings';
import { money } from '@/lib/links';
import { pageMeta } from '@/lib/meta';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/dashboard')({ head: () => pageMeta('Your dashboard', 'Your EarnRight offers, balance, payouts and activity in one clean dashboard.'), loader: ({ context }) => context.queryClient.ensureQueryData(dashboardOptions()), component: Dashboard });

const icons = { game: Gamepad2, video: Play, task: ListChecks } as const;
const labels = { game: 'Play games', video: 'Watch videos', task: 'Micro tasks' } as const;
type Cat = keyof typeof icons;

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardOptions()); const qc = useQueryClient(); const navigate = useNavigate();
  const [view, setView] = useState<'all' | Cat | 'wallet' | 'activity'>('all');
  const [active, setActive] = useState<string | null>(null); const [proof, setProof] = useState(''); const [shot, setShot] = useState<File | null>(null); const watching = useRef<string | null>(null);
  const [amount, setAmount] = useState(''); const [method, setMethod] = useState('PayPal'); const [details, setDetails] = useState(''); const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['dashboard'] });
  async function logout() { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', search: { mode: 'login' }, replace: true }); }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!active) return; setBusy(true);
    try {
      let path = '';
      if (shot) { const { data: u } = await supabase.auth.getUser(); path = `${u.user!.id}/${crypto.randomUUID()}-${shot.name.replace(/[^\w.]/g, '')}`; const up = await supabase.storage.from('proof-screenshots').upload(path, shot); if (up.error) throw up.error; }
      const { error } = await supabase.rpc('submit_proof', { _offer: active, _answer: proof, _screenshot: path }); if (error) throw error;
      toast.success('Submitted for review'); setActive(null); setProof(''); setShot(null); refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); } finally { setBusy(false); }
  }
  async function watch(o: { id: string; link: string }) {
    const win = o.link ? window.open(o.link, '_blank', 'noopener') : null;
    const { error } = await supabase.rpc('start_video', { _offer: o.id }); if (error) { toast.error(error.message); win?.close(); return; }
    watching.current = o.id; toast('Watch the video, then come back here to collect your reward.');
  }
  useEffect(() => {
    async function back() {
      if (document.visibilityState !== 'visible' || !watching.current) return;
      const id = watching.current;
      const { data: r, error } = await supabase.rpc('claim_video', { _offer: id });
      if (error) { toast.error(error.message.includes('Watch for') ? `${error.message} — open it again to keep watching.` : error.message); if (!error.message.includes('Watch for')) watching.current = null; return; }
      watching.current = null; toast.success(`+${money(Number(r))} added to your balance`); refresh();
    }
    document.addEventListener('visibilitychange', back); window.addEventListener('focus', back);
    return () => { document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back); };
  }, []);
  async function withdraw(e: FormEvent) { e.preventDefault(); setBusy(true); const { error } = await supabase.rpc('request_withdrawal', { _amount: Number(amount), _method: method, _details: details }); setBusy(false); if (error) { toast.error(error.message); return; } toast.success('Payment request sent'); setAmount(''); setDetails(''); refresh(); }
  const statusOf = (id: string) => {
    const submissions = data.submissions.filter(s => s.offer_id === id);
    return submissions.find(s => s.status === 'approved')?.status ?? submissions.find(s => s.status === 'pending')?.status ?? submissions[0]?.status;
  };
  const offers = data.offers.filter(o => view === 'all' || o.category === view);
  const pending = data.submissions.filter(s => s.status === 'pending').reduce((a, s) => a + Number(s.reward), 0);
  const nav = [{ k: 'all', n: 'Overview', I: LayoutGrid }, ...(['game', 'video', 'task'] as Cat[]).map(k => ({ k, n: labels[k], I: icons[k] })), { k: 'wallet', n: 'My wallet', I: Wallet }, { k: 'activity', n: 'Activity', I: History }] as const;
  const name = data.profile.display_name || 'Member';
  const activeOffer = data.offers.find(o => o.id === active);
  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar"><Brand /><span className="sidebar-label">YOUR SPACE</span><nav>{nav.map(({ k, n, I }) => <Button key={k} variant={view === k ? 'secondary' : 'ghost'} className={`sidebar-item ${view === k ? 'is-active' : ''}`} onClick={() => setView(k)}><I /> {n}</Button>)}{data.isAdmin && <Button asChild variant="ghost" className="sidebar-item"><Link to="/admin"><ShieldCheck /> Admin panel</Link></Button>}</nav><div className="sidebar-bottom"><SocialLinks /><Button variant="ghost" onClick={logout}><LogOut /> Log out</Button><div className="sidebar-person"><span className="user-avatar">{name.charAt(0).toUpperCase()}</span><div><strong>{name}</strong><small>{data.isAdmin ? 'Admin' : 'EarnRight member'}</small></div></div></div></aside>
    <div className="dashboard-main"><header className="dashboard-header"><span>{nav.find(n => n.k === view)?.n}</span><div>{data.isAdmin && <Button asChild size="sm" variant="ink"><Link to="/admin"><ShieldCheck /> Admin</Link></Button>}<span className="user-avatar">{name.charAt(0).toUpperCase()}</span><Button variant="ghost" size="icon" className="mobile-logout" aria-label="Log out" onClick={logout}><LogOut /></Button></div></header>
      <main className="dashboard-content">
        <div className="dashboard-greeting"><span className="eyebrow">LET’S MAKE TODAY COUNT</span><h1>Hey, {name.split(' ')[0]} <span className="wave">✳</span></h1><p>A little spare time. A little more possibility.</p></div>
        {data.profile.banned && <div className="demo-notice"><X /><p>Your account is suspended. Contact support on WhatsApp.</p></div>}
        <div className="stat-grid"><div className="balance-stat"><span><Wallet /> Available balance</span><strong>{money(data.balance)}</strong><span>Ready to withdraw</span></div><div className="plain-stat"><span>Pending review</span><strong>{money(pending)}</strong><span>Awaiting approval</span></div><div className="plain-stat"><span>Offers available</span><strong>{data.offers.length}</strong><span>Find your next win.</span></div></div>
        {view === 'wallet' ? <section className="wallet-section"><h2>Your wallet.</h2><form className="admin-form" onSubmit={withdraw}><label>Amount (£)<input required type="number" min="1" step="0.01" max={data.balance} value={amount} onChange={e => setAmount(e.target.value)} /></label><label>Method<select value={method} onChange={e => setMethod(e.target.value)}><option>PayPal</option><option>Bank transfer</option><option>Gift card</option></select></label><label>Payment details<input required maxLength={300} value={details} onChange={e => setDetails(e.target.value)} placeholder="PayPal email or account details" /></label><Button variant="ink" disabled={busy || data.balance < 1}>Request payment <ArrowUpRight /></Button></form><RowList rows={data.withdrawals.map(w => ({ id: w.id, title: `${w.method} withdrawal`, sub: new Date(w.created_at).toLocaleDateString(), right: `-${money(w.amount)}`, status: w.status }))} empty="No payment requests yet." /></section>
        : view === 'activity' ? <section><h2>Your activity.</h2><RowList rows={data.submissions.map(s => ({ id: s.id, title: s.offer_title, sub: new Date(s.created_at).toLocaleDateString(), right: `+${money(s.reward)}`, status: s.status }))} empty="Complete your first offer to see it here." /></section>
        : <><div className="dashboard-section-heading"><h2>Your next little win.</h2><span>{offers.length} offers</span></div>{offers.length ? <div className="dashboard-offers">{offers.map(o => { const repeatable = o.category === 'video'; const st = repeatable ? undefined : statusOf(o.id); const I = icons[o.category as Cat] ?? ListChecks; return <article className="offer-card" key={o.id}><div className={`way-art ${o.category}-art`}>{o.src ? <img src={o.src} alt={o.title} className="offer-img" loading="lazy" /> : <div className="art-object"><span><I /></span></div>}<span className="offer-credit">+{money(o.reward)}</span></div><div className="offer-body"><span className="offer-category"><I /> {labels[o.category as Cat]}</span><h3>{o.title}</h3><p>{o.description}</p>{repeatable ? <Button variant="ink" className="offer-start" disabled={data.profile.banned} onClick={() => watch(o)}><Play /> Watch & earn</Button> : <>{o.link && <a className="offer-link" href={o.link} target="_blank" rel="noopener noreferrer">Open offer <ArrowUpRight /></a>}<Button variant={st && st !== 'rejected' ? 'outline' : 'ink'} className="offer-start" disabled={!!st && st !== 'rejected'} onClick={() => setActive(o.id)}>{st === 'pending' ? 'Pending review' : st === 'approved' ? 'Completed' : st === 'rejected' ? 'Rejected – resubmit' : 'Submit proof'}</Button></>}</div></article>; })}</div> : <div className="history-empty"><History /><div><strong>No offers yet.</strong><p>New offers will appear here soon.</p></div></div>}</>}
        <footer className="dashboard-footer"><div className="dashboard-footer-social"><SocialLinks /></div><span>Small moments. More possibility.</span><Link to="/terms">Terms & conditions</Link></footer>
      </main></div>
    <nav className="mobile-dashboard-nav">{nav.map(({ k, n, I }) => <Button key={k} variant={view === k ? 'secondary' : 'ghost'} aria-label={n} size="icon" onClick={() => setView(k)}><I /></Button>)}{data.isAdmin && <Button asChild variant="ghost" size="icon" aria-label="Admin panel"><Link to="/admin"><ShieldCheck /></Link></Button>}</nav>
    {activeOffer && <div className="modal-backdrop" onClick={() => setActive(null)}><form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={submit}><h3>{activeOffer.title}</h3><p>{activeOffer.proof_question || 'Tell us how you completed it (username, code…). An admin will review it.'}</p><textarea required={!activeOffer.require_screenshot || !!activeOffer.proof_question} maxLength={500} value={proof} onChange={e => setProof(e.target.value)} placeholder="Your answer" /><label className="proof-file">Screenshot{activeOffer.require_screenshot ? ' (required)' : ' (optional)'}<input type="file" accept="image/*" required={activeOffer.require_screenshot} onChange={e => setShot(e.target.files?.[0] ?? null)} /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setActive(null)}>Cancel</Button><Button variant="ink" disabled={busy}>Submit</Button></div></form></div>}
  </div>;
}

export function RowList({ rows, empty }: { rows: { id: string; title: string; sub: string; right: string; status: string }[]; empty: string }) {
  return rows.length ? <div className="history-rows">{rows.map(r => <div className="history-row" key={r.id}><div><strong>{r.title}</strong><small>{r.sub}</small></div><span className={`status-pill is-${r.status}`}>{r.status}</span><strong className="history-credit">{r.right}</strong></div>)}</div> : <div className="history-empty"><History /><div><strong>Nothing here yet.</strong><p>{empty}</p></div></div>;
}
