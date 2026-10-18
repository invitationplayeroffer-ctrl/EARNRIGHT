import { MessageCircle, Send } from 'lucide-react';
import { SUPPORT_WHATSAPP, X_URL, TELEGRAM_URL } from '@/lib/links';

function XIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18.1h1.7L6.3 3.8H4.5l13.3 16.3Z" /></svg>; }

export function SocialLinks() {
  return <div className="social-links">
    <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="EarnRight on X" title="EarnRight on X"><XIcon /></a>
    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="EarnRight on Telegram" title="EarnRight on Telegram"><Send /></a>
    <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp support" title="Support on WhatsApp"><MessageCircle /></a>
  </div>;
}
