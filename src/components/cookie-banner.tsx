import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

const KEY = 'earnright-cookies';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* ignore */ } }, []);
  if (!show) return null;
  const choose = (v: string) => { try { localStorage.setItem(KEY, v); } catch { /* ignore */ } setShow(false); };
  return <div className="cookie-bar" role="dialog" aria-label="Cookie notice">
    <p>We use essential cookies to keep you signed in and make EarnRight work. See our <Link to="/terms">terms</Link>.</p>
    <div style={{ display: 'flex', gap: 8 }}>
      <Button size="sm" variant="outline" onClick={() => choose('essential')}>Essential only</Button>
      <Button size="sm" variant="ink" onClick={() => choose('all')}>Accept</Button>
    </div>
  </div>;
}
