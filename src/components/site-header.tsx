import { Link } from '@tanstack/react-router';
import { ArrowUpRight, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from './brand';
import { useAccount } from '@/lib/auth-context';
export function SiteHeader() {
  const { user } = useAccount();
  return <header className="site-header"><Brand /><nav className="header-links"><a href="/#ways">Ways to earn</a><a href="/#how">How it works</a></nav><div className="header-actions">{user ? <Button asChild variant="ink"><Link to="/dashboard"><LayoutGrid /> Dashboard</Link></Button> : <><Button variant="ghost" asChild><Link to="/auth">Log in</Link></Button><Button variant="ink" asChild><Link to="/auth" search={{ mode: 'signup' }}>Get started <ArrowUpRight /></Link></Button></>}</div></header>;
}