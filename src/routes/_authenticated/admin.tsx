import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, Check, X, Trash2, Pencil, Eye, EyeOff, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { adminOptions } from '@/lib/earnings';
import { setUserBan, setUserPassword } from '@/lib/admin.functions';
import { money } from '@/lib/links';
import { pageMeta } from '@/lib/meta';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => pageMeta('Admin panel', 'Manage EarnRight offers, payments, submissions and members.'),
  beforeLoad: async () => { const { data: u } = await supabase.auth.getUser(); const { data } = await supabase.rpc('has_role', { _user_id: u.user!.id, _role: 'admin' }); if (!data) throw redirect({ to: '/dashboard' }); },
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOptions()),
  component: Admin,
});

const tabs = ['Offers', 'Submissions', 'Payments', 'Users'] as const;

function Admin() {
  const { data } = useSuspenseQuery(adminOptions()); const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Submissions');
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });
  const names = new Map(data.users.map(u => [u.id, u.display_name || u.email]));
  const pendingS = data.submissions.filter(s => s.status === 'pending').length; const pendingW = data.withdrawals.filter(w => w.status === 'pending').length;
  async function review(fn: 'review_submission' | 'review_withdrawal', id: string, approve: boolean) { const { error } = await supabase.rpc(fn, { _id: id, _approve: approve }); if (error) { toast.error(error.message); return; } toast.success(approve ? 'Accepted' : 'Rejected'); refresh(); }
  return <div className="admin-shell">
    <header className="admin-header"><Brand /><Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft /> Dashboard</Link></Button></header>
    <main className="admin-main"><h1>Admin panel</h1>
      <div className="admin-tabs">{tabs.map(t => <Button key={t} size="sm" variant={tab === t ? 'ink' : 'outline'} onClick={() => setTab(t)}>{t}{t === 'Submissions' && pendingS ? ` (${pendingS})` : t === 'Payments' && pendingW ? ` (${pendingW})` : ''}</Button>)}</div>
      {tab === 'Offers' && <Offers offers={data.offers} refresh={refresh} />}
      {tab === 'Submissions' && <div className="admin-list">{data.submissions.length ? data.submissions.map(s => <div className="admin-card" key={s.id}><div><strong>{s.offer_title}</strong><small>{names.get(s.user_id)} · {new Date(s.created_at).toLocaleString()}</small><p className="admin-proof">{s.proof || 'No details'}</p>{s.shot && <a href={s.shot} target="_blank" rel="noopener noreferrer"><img src={s.shot} alt="Proof screenshot" className="admin-shot" /></a>}</div><div className="admin-actions"><b>{money(s.reward)}</b><span className={`status-pill is-${s.status}`}>{s.status}</span>{s.status === 'pending' && <><Button size="sm" variant="ink" onClick={() => review('review_submission', s.id, true)}><Check /> Accept</Button><Button size="sm" variant="outline" onClick={() => review('review_submission', s.id, false)}><X /> Reject</Button></>}</div></div>) : <p className="admin-empty">No submissions yet.</p>}</div>}
      {tab === 'Payments' && <div className="admin-list">{data.withdrawals.length ? data.withdrawals.map(w => <div className="admin-card" key={w.id}><div><strong>{names.get(w.user_id)} · {w.method}</strong><small>{new Date(w.created_at).toLocaleString()}</small><p className="admin-proof">{w.details}</p></div><div className="admin-actions"><b>{money(w.amount)}</b><span className={`status-pill is-${w.status}`}>{w.status}</span>{w.status === 'pending' && <><Button size="sm" variant="ink" onClick={() => review('review_withdrawal', w.id, true)}><Check /> Accept</Button><Button size="sm" variant="outline" onClick={() => review('review_withdrawal', w.id, false)}><X /> Reject</Button></>}</div></div>) : <p className="admin-empty">No payment requests yet.</p>}</div>}
      {tab === 'Users' && <Users data={data} refresh={refresh} />}
    </main></div>;
}

function Offers({ offers, refresh }: { offers: any[]; refresh: () => void }) {
  const [f, setF] = useState({ title: '', description: '', category: 'game', reward: '', link: '', proof_question: '', require_screenshot: false, watch_seconds: '30' }); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [editing, setEditing] = useState<any>(null);
  const blank = { title: '', description: '', category: 'game', reward: '', link: '', proof_question: '', require_screenshot: false, watch_seconds: '30' };
  function edit(o: any) { setEditing(o); setFile(null); setF({ title: o.title, description: o.description ?? '', category: o.category, reward: String(o.reward), link: o.link ?? '', proof_question: o.proof_question ?? '', require_screenshot: !!o.require_screenshot, watch_seconds: String(o.watch_seconds ?? 30) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function create(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      let image_url = editing?.image_url ?? '';
      if (file) { image_url = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, '')}`; const up = await supabase.storage.from('offer-images').upload(image_url, file); if (up.error) throw up.error; }
      const row = { ...f, reward: Number(f.reward), watch_seconds: Number(f.watch_seconds) || 30, image_url };
      const { error } = editing ? await supabase.from('offers').update(row).eq('id', editing.id) : await supabase.from('offers').insert(row); if (error) throw error;
      if (editing && file && editing.image_url) await supabase.storage.from('offer-images').remove([editing.image_url]);
      toast.success(editing ? 'Offer updated' : 'Offer published'); setEditing(null); setF({ title: '', description: '', category: 'game', reward: '', link: '', proof_question: '', require_screenshot: false, watch_seconds: '30' }); setFile(null); refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed'); } finally { setBusy(false); }
  }
  async function toggle(o: any) { const { error } = await supabase.from('offers').update({ active: !o.active }).eq('id', o.id); if (error) toast.error(error.message); refresh(); }
  async function remove(o: any) { if (!confirm(`Delete "${o.title}"?`)) return; const { error } = await supabase.from('offers').delete().eq('id', o.id); if (error) { toast.error(error.message); return; } if (o.image_url) await supabase.storage.from('offer-images').remove([o.image_url]); refresh(); }
  return <><form className="admin-form" onSubmit={create}><h2>{editing ? `Edit “${editing.title}”` : 'Upload new offer'}</h2><label>Title<input required maxLength={100} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label><label>Description<textarea maxLength={500} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></label><div className="admin-row"><label>Type<select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}><option value="game">Game</option><option value="video">Video</option><option value="task">Micro task</option></select></label><label>Reward ($)<input required type="number" min="0.01" step="0.01" value={f.reward} onChange={e => setF({ ...f, reward: e.target.value })} /></label></div><label>Offer link (optional)<input type="url" value={f.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="https://" /></label>{f.category === 'video' ? <label>Seconds to watch before auto reward<input type="number" min="5" max="3600" value={f.watch_seconds} onChange={e => setF({ ...f, watch_seconds: e.target.value })} /></label> : <><label>Proof question (e.g. What was the website name?)<input maxLength={200} value={f.proof_question} onChange={e => setF({ ...f, proof_question: e.target.value })} /></label><label className="proof-file"><span><input type="checkbox" checked={f.require_screenshot} onChange={e => setF({ ...f, require_screenshot: e.target.checked })} /> Require homepage screenshot</span></label></>}<label>{editing ? 'Replace image (optional)' : 'Image (optional)'}<input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label><Button variant="ink" disabled={busy}><Upload /> {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish offer'}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setF(blank); setFile(null); }}>Cancel edit</Button>}</form>
    <div className="admin-list">{offers.map(o => <div className="admin-card" key={o.id}>{o.src && <img src={o.src} alt="" className="admin-thumb" />}<div><strong>{o.title}</strong><small>{o.category} · {money(o.reward)} · {o.active ? 'Live' : 'Hidden'}</small></div><div className="admin-actions"><Button size="sm" variant="outline" onClick={() => edit(o)}><Pencil /> Edit</Button><Button size="sm" variant="outline" onClick={() => toggle(o)}>{o.active ? <><EyeOff /> Hide</> : <><Eye /> Show</>}</Button><Button size="sm" variant="outline" aria-label="Delete offer" onClick={() => remove(o)}><Trash2 /></Button></div></div>)}</div></>;
}

function Users({ data, refresh }: { data: any; refresh: () => void }) {
  const ban = useServerFn(setUserBan); const pw = useServerFn(setUserPassword);
  const [open, setOpen] = useState<string | null>(null); const [password, setPassword] = useState(''); const [q, setQ] = useState('');
  const users = data.users.filter((u: any) => `${u.display_name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  async function doBan(u: any) { try { await ban({ data: { userId: u.id, banned: !u.banned } }); toast.success(u.banned ? 'User unbanned' : 'User banned'); refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } }
  async function doPw(e: FormEvent, id: string) { e.preventDefault(); try { await pw({ data: { userId: id, password } }); toast.success('Password updated'); setPassword(''); } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); } }
  return <><input className="admin-search" placeholder="Search members…" value={q} onChange={e => setQ(e.target.value)} /><div className="admin-list">{users.map((u: any) => { const subs = data.submissions.filter((s: any) => s.user_id === u.id); const wds = data.withdrawals.filter((w: any) => w.user_id === u.id); const earned = subs.filter((s: any) => s.status === 'approved').reduce((a: number, s: any) => a + Number(s.reward), 0); return <div className="admin-card is-column" key={u.id}><div className="admin-user-top"><div><strong>{u.display_name}</strong><small>{u.email}</small></div><div className="admin-actions">{u.banned && <span className="status-pill is-rejected">banned</span>}<Button size="sm" variant="outline" onClick={() => setOpen(open === u.id ? null : u.id)}>{open === u.id ? 'Close' : 'Manage'}</Button></div></div>{open === u.id && <div className="admin-user-detail"><p>Earned {money(earned)} · {subs.length} submissions · {wds.length} payment requests</p><div className="admin-activity">{[...subs.map((s: any) => ({ id: s.id, t: s.offer_title, a: `+${money(s.reward)}`, st: s.status, d: s.created_at })), ...wds.map((w: any) => ({ id: w.id, t: `${w.method} withdrawal`, a: `-${money(w.amount)}`, st: w.status, d: w.created_at }))].sort((a, b) => b.d.localeCompare(a.d)).map(r => <div key={r.id}><span>{r.t}</span><span className={`status-pill is-${r.st}`}>{r.st}</span><b>{r.a}</b></div>)}</div><form className="admin-row" onSubmit={e => doPw(e, u.id)}><input type="text" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (8+ chars)" /><Button size="sm" variant="outline">Reset password</Button></form><Button size="sm" variant={u.banned ? 'ink' : 'destructive'} onClick={() => doBan(u)}>{u.banned ? 'Unban user' : 'Ban user'}</Button></div>}</div>; })}</div></>;
}
