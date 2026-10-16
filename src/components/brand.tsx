import { Link } from '@tanstack/react-router';
import logo from '@/assets/earnright-logo.png';
export function Brand() {
  return <Link to="/" className="brand" aria-label="EarnRight home"><img src={logo} alt="EarnRight" width={1043} height={324} className="brand-logo" /></Link>;
}
