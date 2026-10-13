import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { pageMeta } from '@/lib/meta';
import wallpaper from '@/assets/earnright-wallpaper.jpg';
export const Route = createFileRoute('/auth')({ validateSearch: (search: Record<string, unknown>) => ({ mode: search.mode === 'signup' ? 'signup' : 'login' }), head: () => pageMeta('Your account', 'Sign in or create your EarnRight account with email and password. No email verification required.'), component: AuthPage });
function AuthPage() {
  const { mode } = Route.useSearch();
  const signup = mode === 'signup';
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [forgot, setForgot] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (forgot) { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; setMessage('If an account exists, a password reset link is on its way.'); return; }
      const result = signup ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (signup && !result.data.session) { setMessage('Check your email to finish creating your account.'); return; }
      await navigate({ to: '/dashboard' });
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Try again.'); } finally { setBusy(false); }
  }
  return <main className="auth-page"><img src={wallpaper} width={1920} height={1024} alt="Matte silver sculptural wallpaper" className="auth-wallpaper" /><div className="auth-top"><Brand /><Button variant="ghost" asChild><Link to="/"><ArrowLeft /> Back to home</Link></Button></div><section className="auth-panel"><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>{forgot ? 'A fresh start.' : signup ? 'Make time rewarding.' : 'Welcome back.'}</h1><p>{forgot ? 'We’ll send you a link to reset your password.' : signup ? 'A little spare time starts here.' : 'A little more possibility is waiting.'}</p>{!forgot && <div className="auth-tabs"><Button variant={!signup ? 'ink' : 'ghost'} asChild><Link to="/auth" search={{ mode: 'login' }}>Log in</Link></Button><Button variant={signup ? 'ink' : 'ghost'} asChild><Link to="/auth" search={{ mode: 'signup' }}>Create account</Link></Button></div>}<form onSubmit={submit}>{signup && !forgot && <label>Display name<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} autoComplete="nickname" placeholder="What should we call you?" /></label>}<label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>{!forgot && <label>Password<div className="password-field"><input required type={show ? 'text' : 'password'} minLength={8} value={password} onChange={e => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'At least 8 characters' : 'Enter your password'} /><Button type="button" variant="ghost" size="icon" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button></div></label>}{!signup && !forgot && <Button type="button" variant="link" className="forgot-link" onClick={() => { setForgot(true); setError(''); }}>Forgot password?</Button>}{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-message" role="status">{message}</p>}<Button disabled={busy} variant="ink" type="submit" className="auth-submit">{busy ? 'One moment…' : forgot ? 'Send reset link' : signup ? 'Create account' : 'Log in'}<ArrowUpRight /></Button></form>{forgot ? <Button variant="link" onClick={() => { setForgot(false); setMessage(''); setError(''); }}>Back to log in</Button> : <div className="auth-assurance"><ShieldCheck /> Email & password. No verification hoops.</div>}</section><div className="auth-bottom">A little effort. A rewarding habit.</div></main>;
}