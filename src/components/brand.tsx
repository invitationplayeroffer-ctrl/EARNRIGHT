import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
export function Brand() {
  return <Link to="/" className="brand" aria-label="EarnRight home"><span className="brand-mark"><ArrowUpRight strokeWidth={3} /></span><span>EarnRight<span className="text-primary">.</span></span></Link>;
}