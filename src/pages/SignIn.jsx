// The Sign In page. Real authentication now — Supabase Auth checks the
// email + password against the account that was actually created (via
// Sign Up, or via an admin's invite), and tells us if they don't match.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/roles';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const profile = await login(email.trim(), password);
      // If you were redirected here from a protected page, `location.state.from`
      // remembers where you were trying to go, so we can send you right back
      // after logging in (otherwise send you to your role's home page).
      const fallbackPath = location.state?.from?.pathname;
      if (fallbackPath && fallbackPath !== '/sign-in') {
        navigate(fallbackPath, { replace: true });
        return;
      }
      const roleHome =
        profile.role === ROLES.PLATFORM_ADMIN ? '/platform-admin' : profile.role === ROLES.EMPLOYEE ? '/dashboard' : '/admin';
      navigate(roleHome, { replace: true });
    } catch {
      // Supabase's error messages are accurate but not user-friendly
      // ("Invalid login credentials") — show something clearer instead.
      setError('That email and password combination is not recognized.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-6 relative z-10">
      <div className="w-full max-w-md animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ef233c] rounded-2xl shadow-[0_0_20px_rgba(239,35,60,0.3)] mb-6">
            <iconify-icon icon="material-symbols:lock" className="text-white text-3xl"></iconify-icon>
          </div>
          <h1 className="text-4xl font-bold font-manrope tracking-tighter mb-3">Welcome Back</h1>
          <p className="text-zinc-400">Access your CLICKWISE security console</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, #ef233c, transparent 70%)' }}
          />

          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
                <iconify-icon icon="material-symbols:error"></iconify-icon> {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-zinc-600 focus:outline-none input-glow transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Password
                </label>
                {/* placeholder link — there's no forgot-password flow built yet */}
                <a href="#forgot-password" className="text-xs font-medium text-[#ef233c] hover:text-red-400 transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-zinc-600 focus:outline-none input-glow transition-all"
              />
            </div>

            {/* decorative checkbox — not wired up to anything (no "remember me" logic exists) */}
            <div className="flex items-center ml-1">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-5 h-5 bg-black border border-white/10 rounded peer-checked:bg-[#ef233c] peer-checked:border-[#ef233c] transition-all" />
                  <iconify-icon
                    icon="material-symbols:check"
                    className="absolute top-0.5 left-0.5 text-xs text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  ></iconify-icon>
                </div>
                <span className="ml-3 text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full shiny-cta group active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-white font-bold uppercase tracking-widest text-sm">
                {submitting ? 'Signing In…' : 'Sign Into Console'}{' '}
                {!submitting && (
                  <iconify-icon icon="material-symbols:arrow-forward" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                )}
              </span>
            </button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-zinc-500 text-sm">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-white font-semibold hover:text-[#ef233c] transition-colors">
              Create a new organization
            </Link>
          </p>
          <p className="text-zinc-600 text-xs">
            Invited members: sign in with the email your admin added, using the password from your invite email.
          </p>
        </div>
      </div>
    </main>
  );
}
