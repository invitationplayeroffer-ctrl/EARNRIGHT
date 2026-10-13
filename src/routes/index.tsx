import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowRight, Gamepad2, Play, ListChecks, Check, ShieldCheck, Sparkles, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { Brand } from '@/components/brand';
import { pageMeta } from '@/lib/meta';
import wallpaper from '@/assets/earnright-drift.jpg';
import { SocialLinks } from '@/components/social-links';
export const Route = createFileRoute('/')({ head: () => pageMeta('EarnRight — Make time rewarding', 'Play games, watch videos and complete micro tasks. Discover a more rewarding way to spend your spare time.'), component: Welcome });
const ways = [
  { name: 'Play games', subtitle: 'A little play. A little payday.', description: 'Discover new games and turn your next high score into something more.', icon: Gamepad2, className: 'game-art', tag: 'FOR THE PLAYERS', symbol: '✦' },
  { name: 'Watch videos', subtitle: 'Your next watch, rewarded.', description: 'Take a break with short videos and discover something worth your time.', icon: Play, className: 'video-art', tag: 'SIT BACK & EARN', symbol: '▶' },
  { name: 'Complete tasks', subtitle: 'Small tasks. Real potential.', description: 'Share an opinion, answer a question, or tick off a quick micro task.', icon: ListChecks, className: 'task-art', tag: 'MAKE A LITTLE DIFFERENCE', symbol: '✓' },
];
function Welcome() {
  return <div className="welcome"><SiteHeader />
    <main>
      <section className="welcome-hero">
        <img src={wallpaper} width={1920} height={1024} alt="3D cartoon red supercar drifting with tyre smoke on a matte grey track" className="hero-wallpaper" />
        <div className="hero-shade" />
        <div className="hero-content"><span className="eyebrow hero-eyebrow"><span className="status-dot" /> YOUR TIME. BETTER SPENT.</span><h1>EarnRight<span>.</span></h1><h2>A little spare time.<br />A lot more possibility.</h2><p>Play, watch, and get things done.<br />Make your everyday moments more rewarding.</p><Button variant="hero" asChild><Link to="/auth" search={{ mode: 'signup' }}>Start earning <ArrowUpRight /></Link></Button><div className="hero-checks"><span><Check /> Free to join</span><span><Check /> Real rewards, paid by request</span></div></div>
        <div className="wallpaper-label"><span className="status-dot" /> A NEW WAY TO SPEND YOUR DOWNTIME <span>01 / 03</span></div>
        <div className="floating-note"><div className="note-icon"><Sparkles /></div><div>A little effort.<br /><strong>A rewarding habit.</strong></div><ArrowUpRight /></div>
      </section>
      <div className="trust-strip"><span><ShieldCheck /> Your time has value</span><span><Clock3 /> On your schedule</span><span><Sparkles /> A little something for everyone</span></div>
      <section id="ways" className="ways-section"><div className="section-heading"><div><span className="eyebrow">A LITTLE TIME GOES A LONG WAY</span><h2>Find your way to earn.</h2></div><p>Your downtime, your choice.<br />Pick something that feels like you.</p></div><div className="ways-grid">{ways.map(({ name, subtitle, description, icon: Icon, className, tag, symbol }, i) => <Link key={name} to="/auth" search={{ mode: 'signup' }} className="way-card"><div className={`way-art ${className}`}><span className="art-tag">{tag}</span><div className="art-object"><span>{symbol}</span></div><span className="art-index">0{i + 1}</span><span className="art-arrow"><ArrowUpRight /></span></div><div className="way-body"><h3><Icon />{name}</h3><strong>{subtitle}</strong><p>{description}</p></div></Link>)}</div></section>
      <section id="how" className="how-section"><div><span className="eyebrow">NO COMPLICATED START</span><h2>Good things start small.</h2><Button asChild variant="ink"><Link to="/auth" search={{ mode: 'signup' }}>Let’s get started <ArrowRight /></Link></Button></div><ol><li><span>01</span><div><h3>Make yourself at home</h3><p>Create your free account. No verification hoops.</p></div></li><li><span>02</span><div><h3>Do a little of what you like</h3><p>Choose a game, a video, or a bite-sized task.</p></div></li><li><span>03</span><div><h3>See your progress add up</h3><p>Keep your activities and rewards in one place.</p></div></li></ol></section>
    </main><footer className="site-footer"><Brand /><SocialLinks /><Link to="/terms">Terms & conditions</Link><span>© {new Date().getFullYear()} EarnRight</span></footer>
  </div>;
}