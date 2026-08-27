// A warning strip shown across every page for anyone whose account was
// created by their org admin with the shared default password — it stays
// up until they actually set their own password on the Profile page
// (see AuthContext.jsx's changePassword, which clears the flag behind this).
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PasswordChangeBanner() {
  const { user } = useAuth();

  // Not logged in, or already changed their password — show nothing.
  if (!user?.mustChangePassword) return null;

  return (
    <div className="relative z-20 mt-24 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-sm px-4 py-3 flex items-center justify-center gap-2 text-center flex-wrap print:hidden">
      <iconify-icon icon="material-symbols:warning" className="shrink-0"></iconify-icon>
      <span>You're using a temporary password. For your account's security, please set your own password.</span>
      <Link to="/profile" className="font-bold underline underline-offset-2 shrink-0 hover:text-amber-200">
        Change it now
      </Link>
    </div>
  );
}
