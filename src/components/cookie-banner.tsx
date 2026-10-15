import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KEY = 'earnright-cookies';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* ignore */ } }, []);
  if (!show) return null;
  const choose = (v: string) => { try { localStorage.setItem(KEY, v); } catch { /* ignore */ } setShow(false); };
  return <div className="cookie-overlay"><div className="cookie-bar" role="dialog" aria-modal="true" aria-label="Cookie notice">
    <Cookie className="cookie-icon" /><h2>We use cookies</h2><p>We use essential cookies to keep you signed in and make EarnRight work. See our <Link to="/terms">terms</Link>.</p>
    <div className="cookie-actions">
      <Button size="sm" variant="outline" onClick={() => choose('essential')}>Essential only</Button>
      <Button size="sm" variant="ink" onClick={() => choose('all')}>Accept</Button>
    </div>
  </div></div>;
}
