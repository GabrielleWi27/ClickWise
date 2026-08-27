// The pill-shaped bar fixed to the top of every page. What links it shows
// changes depending on whether you're logged in, and if so, which role
// you are — an Employee sees different links than an Org Admin.
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/roles';

// Where the "Dashboard" link should point for each role.
const DASHBOARD_BY_ROLE = {
  [ROLES.PLATFORM_ADMIN]: '/platform-admin',
  [ROLES.ORG_ADMIN]: '/admin',
  [ROLES.EMPLOYEE]: '/dashboard',
};

// Builds the list of nav links to show, based on the current role.
// `role` is undefined when nobody is logged in — in that case only the
// public links show, since Simulations/Training/Dashboard all require an account.
function getNavLinks(role) {
  const base = [{ label: 'Home', to: '/' }, { label: 'Threat Intel', to: '/threat-intel' }];
  // Only Org Admins and Employees see these — Platform Admins manage the
  // whole platform, not one company's simulations, and logged-out
  // visitors can't access these pages at all (see the "Try Demo" link
  // instead for a no-login preview).
  if (role === ROLES.ORG_ADMIN || role === ROLES.EMPLOYEE) {
    base.push({ label: 'Simulations', to: '/simulations' }, { label: 'Training', to: '/training' });
  }
  // Only show Dashboard once actually logged in — there's no "default"
  // dashboard for a logged-out visitor to go to.
  if (role) {
    base.push({ label: 'Dashboard', to: DASHBOARD_BY_ROLE[role] ?? '/admin' });
  }
  return base;
}

export default function Navigation() {
  const { pathname } = useLocation(); // current URL, used to highlight the active link
  const { user, loggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // send them back to the homepage after logging out
  };

  const navLinks = getNavLinks(user?.role);

  return (
    <header className="fixed top-0 left-0 w-full z-50 pt-6 px-4">
      <nav className="max-w-6xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl">
        {/* logo on the far left — always links back home */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center bg-[#ef233c] rounded-lg shadow-[0_0_15px_#ef233c]">
            <iconify-icon icon="material-symbols:shield" className="text-white text-sm"></iconify-icon>
          </div>
          <span className="text-xl font-bold font-manrope tracking-tighter">CLICKWISE</span>
        </Link>

        {/* the middle links, built above by getNavLinks() — the current page's link is highlighted white */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                pathname === link.to ? 'text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side of the bar: Profile/Log Out if signed in, otherwise Sign In/Sign Up */}
        {loggedIn ? (
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors ${
                pathname === '/profile' ? 'text-white' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <iconify-icon icon="material-symbols:account-circle"></iconify-icon>
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2 transition-transform active:scale-95 text-white"
            >
              <span className="absolute inset-0 border border-white/10 rounded-full" />
              <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <iconify-icon icon="material-symbols:logout"></iconify-icon>
                Log Out
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/sign-in"
              className={`hidden md:block text-sm font-medium transition-colors ${
                pathname === '/sign-in' ? 'text-white' : 'text-zinc-300 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2 transition-transform active:scale-95 text-white"
            >
              <span className="absolute inset-0 border border-white/10 rounded-full" />
              <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ef233c_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute inset-[1px] rounded-full bg-black" />
              <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                Protect Now <iconify-icon icon="material-symbols:arrow-forward" className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"></iconify-icon>
              </span>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
