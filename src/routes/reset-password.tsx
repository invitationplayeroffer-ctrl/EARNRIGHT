import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { supabase } from '@/integrations/supabase/client';
import { pageMeta } from '@/lib/meta';
export const Route = createFileRoute('/reset-password')({ head: () => pageMeta('Reset password', 'Choose a new password for your EarnRight account.'), component: ResetPassword });
function ResetPassword() {
  const [valid, setValid] = useState(false); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { const recovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'; void supabase.auth.getUser().then(({ data }) => setValid(recovery && !!data.user)); }, []);
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) setMessage(error.message); else { setDone(true); setMessage('Your password has been updated.'); } }
  return <main className="reset-page"><Brand /><section className="auth-panel"><h1>A fresh start.</h1>{done ? <><p role="status">{message}</p><Button asChild variant="ink"><Link to="/dashboard">Go to dashboard</Link></Button></> : valid ? <form onSubmit={submit}><label>New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>{message && <p role="alert">{message}</p>}<Button type="submit" disabled={busy} variant="ink">{busy ? 'Updating…' : 'Update password'}</Button></form> : <><p>Open the password reset link from your email. If it has expired, request a new one.</p><Button asChild variant="ink"><Link to="/auth">Back to log in</Link></Button></>}</section></main>;
}