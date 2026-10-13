import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowUpRight, LayoutGrid, Gamepad2, Play, ListChecks, Wallet, History, LogOut, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { SocialLinks, SupportButton } from '@/components/social-links';
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
  const [active, setActive] = useState<string | null>(null); const [proof, setProof] = useState('');
  const [amount, setAmount] = useState(''); const [method, setMethod] = useState('PayPal'); const [details, setDetails] = useState(''); const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['dashboard'] });
  async function logout() { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', search: { mode: 'login' }, replace: true }); }
  async function submit(e: FormEvent) { e.preventDefault(); if (!active) return; setBusy(true); const { error } = await supabase.rpc('submit_offer', { _offer: active, _proof: proof }); setBusy(false); if (error) return toast.error(error.message); toast.success('Submitted for review'); setActive(null); setProof(''); refresh(); }
  async function withdraw(e: FormEvent) { e.preventDefault(); setBusy(true); const { error } = await supabase.rpc('request_withdrawal', { _amount: Number(amount), _method: method, _details: details }); setBusy(false); if (error) return toast.error(error.message); toast.success('Payment request sent'); setAmount(''); setDetails(''); refresh(); }
  const statusOf = (id: string) => data.submissions.find(s => s.offer_id === id)?.status;
  const offers = data.offers.filter(o => view === 'all' || o.category === view);
  const pending = data.submissions.filter(s => s.status === 'pending').reduce((a, s) => a + Number(s.reward), 0);
  const nav = [{ k: 'all', n: 'Overview', I: LayoutGrid }, ...(['game', 'video', 'task'] as Cat[]).map(k => ({ k, n: labels[k], I: icons[k] })), { k: 'wallet', n: 'My wallet', I: Wallet }, { k: 'activity', n: 'Activity', I: History }] as const;
  const name = data.profile.display_name || 'Member';
  const activeOffer = data.offers.find(o => o.id === active);
  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar"><Brand /><span className="sidebar-label">YOUR SPACE</span><nav>{nav.map(({ k, n, I }) => <Button key={k} variant={view === k ? 'secondary' : 'ghost'} className={`sidebar-item ${view === k ? 'is-active' : ''}`} onClick={() => setView(k)}><I /> {n}</Button>)}{data.isAdmin && <Button asChild variant="ghost" className="sidebar-item"><Link to="/admin"><ShieldCheck /> Admin panel</Link></Button>}</nav><div className="sidebar-bottom"><SocialLinks /><Button variant="ghost" onClick={logout}><LogOut /> Log out</Button><div className="sidebar-person"><span className="user-avatar">{name[0].toUpperCase()}</span><div><strong>{name}</strong><small>{data.isAdmin ? 'Admin' : 'EarnRight member'}</small></div></div></div></aside>
    <div className="dashboard-main"><header className="dashboard-header"><span>{nav.find(n => n.k === view)?.n}</span><div>{data.isAdmin && <Button asChild size="sm" variant="ink"><Link to="/admin"><ShieldCheck /> Admin</Link></Button>}<span className="user-avatar">{name[0].toUpperCase()}</span><Button variant="ghost" size="icon" className="mobile-logout" aria-label="Log out" onClick={logout}><LogOut /></Button></div></header>
      <main className="dashboard-content">
        <div className="dashboard-greeting"><span className="eyebrow">LET’S MAKE TODAY COUNT</span><h1>Hey, {name.split(' ')[0]} <span className="wave">✳</span></h1><p>A little spare time. A little more possibility.</p></div>
        {data.profile.banned && <div className="demo-notice"><X /><p>Your account is suspended. Contact support on WhatsApp.</p></div>}
        <div className="stat-grid"><div className="balance-stat"><span><Wallet /> Available balance</span><strong>{money(data.balance)}</strong><span>Ready to withdraw</span></div><div className="plain-stat"><span>Pending review</span><strong>{money(pending)}</strong><span>Awaiting approval</span></div><div className="plain-stat"><span>Offers available</span><strong>{data.offers.length}</strong><span>Find your next win.</span></div></div>
        {view === 'wallet' ? <section className="wallet-section"><h2>Your wallet.</h2><form className="admin-form" onSubmit={withdraw}><label>Amount (£)<input required type="number" min="1" step="0.01" max={data.balance} value={amount} onChange={e => setAmount(e.target.value)} /></label><label>Method<select value={method} onChange={e => setMethod(e.target.value)}><option>PayPal</option><option>Bank transfer</option><option>Gift card</option></select></label><label>Payment details<input required maxLength={300} value={details} onChange={e => setDetails(e.target.value)} placeholder="PayPal email or account details" /></label><Button variant="ink" disabled={busy || data.balance < 1}>Request payment <ArrowUpRight /></Button></form><RowList rows={data.withdrawals.map(w => ({ id: w.id, title: `${w.method} withdrawal`, sub: new Date(w.created_at).toLocaleDateString(), right: `-${money(w.amount)}`, status: w.status }))} empty="No payment requests yet." /></section>
        : view === 'activity' ? <section><h2>Your activity.</h2><RowList rows={data.submissions.map(s => ({ id: s.id, title: s.offer_title, sub: new Date(s.created_at).toLocaleDateString(), right: `+${money(s.reward)}`, status: s.status }))} empty="Complete your first offer to see it here." /></section>
        : <><div className="dashboard-section-heading"><h2>Your next little win.</h2><span>{offers.length} offers</span></div>{offers.length ? <div className="dashboard-offers">{offers.map(o => { const st = statusOf(o.id); const I = icons[o.category as Cat] ?? ListChecks; return <article className="offer-card" key={o.id}><div className={`way-art ${o.category}-art`}>{o.src ? <img src={o.src} alt={o.title} className="offer-img" loading="lazy" /> : <div className="art-object"><span><I /></span></div>}<span className="offer-credit">+{money(o.reward)}</span></div><div className="offer-body"><span className="offer-category"><I /> {labels[o.category as Cat]}</span><h3>{o.title}</h3><p>{o.description}</p>{o.link && <a className="offer-link" href={o.link} target="_blank" rel="noopener noreferrer">Open offer <ArrowUpRight /></a>}<Button variant={st && st !== 'rejected' ? 'outline' : 'ink'} className="offer-start" disabled={!!st && st !== 'rejected'} onClick={() => setActive(o.id)}>{st === 'pending' ? 'Pending review' : st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected – resubmit' : 'I’ve completed it'}</Button></div></article>; })}</div> : <div className="history-empty"><History /><div><strong>No offers yet.</strong><p>New offers will appear here soon.</p></div></div>}</>}
        <footer className="dashboard-footer"><span>Small moments. More possibility.</span><Link to="/terms">Terms & conditions</Link></footer>
      </main></div>
    <nav className="mobile-dashboard-nav">{nav.map(({ k, n, I }) => <Button key={k} variant={view === k ? 'secondary' : 'ghost'} aria-label={n} size="icon" onClick={() => setView(k)}><I /></Button>)}{data.isAdmin && <Button asChild variant="ghost" size="icon" aria-label="Admin panel"><Link to="/admin"><ShieldCheck /></Link></Button>}</nav>
    {activeOffer && <div className="modal-backdrop" onClick={() => setActive(null)}><form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={submit}><h3>{activeOffer.title}</h3><p>Tell us how you completed it (username, screenshot link, code…). An admin will review it.</p><textarea required maxLength={500} value={proof} onChange={e => setProof(e.target.value)} /><div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setActive(null)}>Cancel</Button><Button variant="ink" disabled={busy}>Submit</Button></div></form></div>}
    <SupportButton />
  </div>;
}

export function RowList({ rows, empty }: { rows: { id: string; title: string; sub: string; right: string; status: string }[]; empty: string }) {
  return rows.length ? <div className="history-rows">{rows.map(r => <div className="history-row" key={r.id}><div><strong>{r.title}</strong><small>{r.sub}</small></div><span className={`status-pill is-${r.status}`}>{r.status}</span><strong className="history-credit">{r.right}</strong></div>)}</div> : <div className="history-empty"><History /><div><strong>Nothing here yet.</strong><p>{empty}</p></div></div>;
}
