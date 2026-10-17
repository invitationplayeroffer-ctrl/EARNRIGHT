import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { SocialLinks } from '@/components/social-links';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/terms')({ head: () => pageMeta('Terms & conditions', 'The terms and conditions for using EarnRight, earning rewards and requesting payments.'), component: Terms });

const sections: [string, string][] = [
  ['1. About EarnRight', 'EarnRight lets members earn rewards by playing games, watching videos and completing micro tasks offered on the platform. By creating an account you agree to these terms.'],
  ['2. Eligibility', 'You must be at least 18 years old (or the age of majority where you live) and may hold only one account. Information you give us must be accurate.'],
  ['3. Earning rewards', 'Game and micro-task offers require approved proof and are one-time. Videos are repeatable and credited after the required viewing time. Stack rewards can be claimed repeatedly, including after a failed game, after a minimum three-second ad visit. We may reject submissions that are incomplete, duplicated, automated, or fraudulent. Reward amounts shown are set per offer and may change.'],
  ['4. Payments', 'You may request a payment once you have an available balance of at least $20.00. New members receive a $5.00 welcome bonus, which counts towards this but cannot be cashed out on its own. Payment requests are reviewed manually and may be accepted or rejected. You are responsible for providing correct payment details; we are not liable for payments sent to details you supplied.'],
  ['5. Prohibited behaviour', 'No bots, VPN abuse, multiple accounts, fake proof or any attempt to manipulate rewards. Breaking these rules may lead to rejected rewards, forfeited balance and a ban.'],
  ['6. Suspension and termination', 'We may suspend or ban accounts that break these terms. Banned accounts cannot sign in, submit offers or request payments.'],
  ['7. Third-party offers', 'Some offers link to other websites or apps. We are not responsible for third-party content, products or privacy practices.'],
  ['8. Liability', 'EarnRight is provided “as is”. To the fullest extent permitted by law we are not liable for indirect losses or for interruptions to the service.'],
  ['9. Changes', 'We may update these terms. Continued use of EarnRight after changes means you accept the updated terms.'],
  ['10. Contact', 'Questions? Reach our support team on WhatsApp at +44 7471 342276.'],
];

function Terms() {
  return <div className="terms-page"><header className="admin-header"><Brand /><Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft /> Home</Link></Button></header><main className="terms-main"><span className="eyebrow">LEGAL</span><h1>Terms & conditions</h1>{sections.map(([h, p]) => <section key={h}><h2>{h}</h2><p>{p}</p></section>)}<SocialLinks /></main></div>;
}
