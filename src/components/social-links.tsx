import { MessageCircle } from 'lucide-react';
import { SUPPORT_WHATSAPP, X_URL, INSTAGRAM_URL } from '@/lib/links';

function XIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18.1h1.7L6.3 3.8H4.5l13.3 16.3Z" /></svg>; }
function InstaIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>; }

export function SocialLinks() {
  return <div className="social-links">
    <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="EarnRight on X" title="EarnRight on X"><XIcon /></a>
    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="EarnRight on Instagram" title="EarnRight on Instagram"><InstaIcon /></a>
    <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp support" title="Support on WhatsApp"><MessageCircle /></a>
  </div>;
}

