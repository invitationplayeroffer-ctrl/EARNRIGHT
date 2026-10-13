import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getDashboard = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [profile, activity] = await Promise.all([
    context.supabase.from('profiles').select('display_name').eq('id', context.userId).single(),
    context.supabase.from('demo_activity').select('*').order('completed_at', { ascending: false }),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (activity.error) throw new Error(activity.error.message);
  return { profile: profile.data, activity: activity.data };
});
export const dashboardOptions = () => queryOptions({ queryKey: ['dashboard'], queryFn: () => getDashboard() });
export const startActivity = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ activity: z.enum(['game', 'video', 'task']) }).parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc('start_demo_activity', data);
  if (result.error) throw new Error(result.error.message);
});
export const finishActivity = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ activity: z.enum(['game', 'video', 'task']), answer: z.string().max(50) }).parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc('complete_demo_activity', data);
  if (result.error) throw new Error(result.error.message);
});