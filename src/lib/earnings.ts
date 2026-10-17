import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function withImages<T extends { image_url: string }>(rows: T[]) {
  const paths = rows.map(r => r.image_url).filter(Boolean);
  if (!paths.length) return rows.map(r => ({ ...r, src: '' }));
  const { data } = await supabase.storage.from('offer-images').createSignedUrls(paths, 3600);
  const map = new Map((data ?? []).map(d => [d.path, d.signedUrl]));
  return rows.map(r => ({ ...r, src: map.get(r.image_url) ?? '' }));
}

export const dashboardOptions = () => queryOptions({
  queryKey: ['dashboard'],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Sign in first');
    const uid = auth.user.id;
    const [profile, offers, subs, wd, bal, role, rewards] = await Promise.all([
      supabase.from('profiles').select('display_name, banned').eq('id', uid).single(),
      supabase.from('offers').select('*').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('submissions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.rpc('user_balance', { _user: uid }),
      supabase.rpc('has_role', { _user_id: uid, _role: 'admin' }),
      supabase.from('reward_events').select('*').eq('user_id', uid).eq('claimed', true).order('started_at', { ascending: false }),
    ]);
    for (const r of [profile, offers, subs, wd, bal, rewards]) if (r.error) throw new Error(r.error.message);
    return { profile: profile.data ?? { display_name: 'Member', banned: false }, rewards: rewards.data ?? [], offers: await withImages(offers.data ?? []), submissions: subs.data ?? [], withdrawals: wd.data ?? [], balance: Number(bal.data ?? 0), isAdmin: !!role.data };
  },
});

export const adminOptions = () => queryOptions({
  queryKey: ['admin'],
  queryFn: async () => {
    const [offers, subs, wd, users, rewards] = await Promise.all([
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('reward_events').select('*').eq('claimed', true).order('started_at', { ascending: false }),
    ]);
    for (const r of [offers, subs, wd, users, rewards]) if (r.error) throw new Error(r.error.message);
    const sp = (subs.data ?? []).map(s => s.screenshot_path).filter(Boolean);
    const signed = sp.length ? (await supabase.storage.from('proof-screenshots').createSignedUrls(sp, 3600)).data ?? [] : [];
    const sm = new Map(signed.map(d => [d.path, d.signedUrl]));
    return { rewards: rewards.data ?? [], offers: await withImages(offers.data ?? []), submissions: (subs.data ?? []).map(s => ({ ...s, shot: sm.get(s.screenshot_path) ?? '' })), withdrawals: wd.data ?? [], users: users.data ?? [] };
  },
});
