import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!data) throw new Error('Admins only');
}

export const setUserBan = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error('You cannot ban yourself');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const a = await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: data.banned ? '876000h' : 'none' });
    if (a.error) throw new Error(a.error.message);
    const p = await supabaseAdmin.from('profiles').update({ banned: data.banned }).eq('id', data.userId);
    if (p.error) throw new Error(p.error.message);
  });

export const setUserPassword = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const r = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (r.error) throw new Error(r.error.message);
  });
