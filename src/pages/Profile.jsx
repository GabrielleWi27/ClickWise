// The account settings page. Layout is loosely inspired by a Dribbble SaaS
// profile page (narrow icon-list sidebar + a wider "Personal Information"
// panel with individually-editable field rows), rebuilt in ClickWise's own
// Red Noir look — dark glass cards, red accent, Manrope/Inter.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { supabase } from '../lib/supabaseClient';
import { ROLES, ROLE_LABELS } from '../data/roles';
import { getPlan } from '../data/plans';
import { getActivityLog, formatRelativeTime } from '../utils/activityLog';

// Tailwind color classes for each kind of activity log entry.
const COLOR_CLASSES = {
  emerald: 'bg-emerald-500/20 text-emerald-500',
  red: 'bg-[#ef233c]/20 text-[#ef233c]',
  blue: 'bg-blue-500/20 text-blue-500',
};

// Turns "Jane Doe" into "JD" for the profile picture circle.
function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// The "Organization" shown here is derived straight from the person's own
// email domain (e.g. jane@webteam.io -> "Webteam") rather than the
// company's official registered name — a quick, friendly label for this
// card, not meant to replace the real org name shown elsewhere in the app.
function orgNameFromEmail(email) {
  const domain = email.split('@')[1] || '';
  const label = domain.split('.')[0] || domain;
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : '—';
}

export default function Profile() {
  const { user, logout, changePassword, refreshProfile } = useAuth();
  const { getOrgById } = useOrg();
  const [org, setOrg] = useState(null);
  const [activity, setActivity] = useState([]);
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securitySubmitting, setSecuritySubmitting] = useState(false);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [passwordFormOpen, setPasswordFormOpen] = useState(false); // toggles the Change Password dropdown
  // Each password field gets its own show/hide toggle, so revealing one
  // doesn't reveal the others.
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const isPlatformAdmin = user.role === ROLES.PLATFORM_ADMIN;

  useEffect(() => {
    getOrgById(user.orgId).then(setOrg);
    // Platform Admins aren't tied to one company's simulations/training, so
    // they don't get an activity feed here.
    if (!isPlatformAdmin) getActivityLog(user.id).then(setActivity);
  }, [user.orgId, user.id, isPlatformAdmin, getOrgById]);

  const isEmployee = user.role === ROLES.EMPLOYEE;
  const plan = getPlan(org?.planId);

  const handleLogout = () => {
    logout();
    navigate('/'); // send them to the homepage after logging out
  };

  // Uploads the chosen file to this user's own folder in the "avatars"
  // bucket (storage RLS only allows writing under your own user id), then
  // saves the resulting public URL onto the profile.
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setAvatarBusy(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust the URL so the new picture shows immediately instead of
      // a browser-cached copy of whatever used to be at this same path.
      await supabase.from('profiles').update({ avatar_url: `${publicUrl}?v=${Date.now()}` }).eq('id', user.id);
      await refreshProfile();
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setAvatarBusy(false);
      e.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarBusy(true);
    try {
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      await refreshProfile();
    } finally {
      setAvatarBusy(false);
    }
  };

  // Changes the account's real password. Re-checks the current password
  // first (by attempting a real sign-in with it) so a hijacked but still
  // logged-in session can't silently lock the real owner out.
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (newPassword.length < 6) return setSecurityError('New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setSecurityError("New password and confirmation don't match.");

    setSecuritySubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (verifyError) throw new Error('Current password is incorrect.');

      await changePassword(newPassword);
      setSecuritySuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSecurityError(err.message);
    } finally {
      setSecuritySubmitting(false);
    }
  };

  return (
    <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8 animate-fade-up">
        {/* LEFT: a narrow "who you are" sidebar — summary card up top,
            then icon-list rows for role/org/plan/last-login, then quick
            links. Layout inspired by a Dribbble SaaS profile reference,
            restyled in ClickWise's own dark/red aesthetic. */}
        <aside className="lg:w-[320px] shrink-0 space-y-6">
          <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center">
            <div className="relative group mb-5">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-28 h-28 rounded-full object-cover border-2 border-white/10 shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-white/10 flex items-center justify-center text-3xl font-bold font-manrope text-white shadow-2xl">
                  {initials(user.name)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold font-manrope mb-1">{user.name}</h2>
            <p className="text-zinc-500 text-sm mb-6 break-all">{user.email}</p>

            <div className="w-full space-y-1 text-left">
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-[#ef233c] flex items-center justify-center shrink-0">
                  <iconify-icon icon="material-symbols:shield-person"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Role</p>
                  <p className="text-sm font-medium truncate">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <iconify-icon icon="material-symbols:domain"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {isPlatformAdmin ? 'Access' : 'Organization'}
                  </p>
                  <p className="text-sm font-medium truncate">{isPlatformAdmin ? 'All Organizations' : orgNameFromEmail(user.email)}</p>
                </div>
              </div>
              {!isPlatformAdmin && (
                <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <iconify-icon icon="material-symbols:bolt"></iconify-icon>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan</p>
                    <p className="text-sm font-medium truncate">{plan.name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <iconify-icon icon="material-symbols:schedule"></iconify-icon>
                </div>
                {/* hardcoded — there's no real last-login timestamp tracked/shown here */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Last Login</p>
                  <p className="text-sm font-medium truncate">Just now</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: the wider "Personal Information" panel. */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold font-manrope mb-8">Personal Information</h3>

            <div className="flex flex-wrap items-center gap-5 mb-8">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-white/10 flex items-center justify-center text-xl font-bold font-manrope text-white">
                  {initials(user.name)}
                </div>
              )}
              <div>
                <p className="font-bold font-manrope">{user.name}</p>
                <p className="text-xs text-zinc-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <div className="flex gap-3 ml-auto">
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="px-5 py-2.5 bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all"
                >
                  {avatarBusy ? 'Uploading…' : 'Upload New Picture'}
                </button>
                {user.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarDelete}
                    disabled={avatarBusy}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {avatarError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 mb-6">
                <iconify-icon icon="material-symbols:error"></iconify-icon> {avatarError}
              </p>
            )}

            {/* display-only rows for now — the pencil/lock icons are visual cues, not clickable edit controls yet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Display Name</p>
                  <p className="text-sm text-zinc-200 truncate">{user.name}</p>
                </div>
                <iconify-icon icon="material-symbols:edit" className="text-zinc-500 shrink-0"></iconify-icon>
              </div>
              <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Email Address</p>
                  <p className="text-sm text-zinc-200 truncate">{user.email}</p>
                </div>
                <iconify-icon icon="material-symbols:lock" className="text-zinc-600 shrink-0"></iconify-icon>
              </div>
            </div>
          </div>

          {/* Quick links — My Dashboard navigates away, Change Password
              expands a dropdown in place, Log Out signs out immediately. */}
          <div className="glass-card rounded-3xl p-3">
            {isEmployee && (
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-white/5 text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-[#ef233c] transition-colors">
                  <iconify-icon icon="material-symbols:space-dashboard"></iconify-icon>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">My Dashboard</p>
                  <p className="text-[11px] text-zinc-500">Your marks and stats</p>
                </div>
                <iconify-icon icon="material-symbols:chevron-right" className="text-zinc-600"></iconify-icon>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setPasswordFormOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors group text-left"
              aria-expanded={passwordFormOpen}
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-[#ef233c] transition-colors">
                <iconify-icon icon="material-symbols:key"></iconify-icon>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Change Password</p>
                <p className="text-[11px] text-zinc-500">Update your security</p>
              </div>
              <iconify-icon
                icon="material-symbols:expand-more"
                className={`text-zinc-500 transition-transform ${passwordFormOpen ? 'rotate-180' : ''}`}
              ></iconify-icon>
            </button>

            {/* The dropdown itself — same password-change logic as before,
                just tucked inside this row instead of a separate card. */}
            {passwordFormOpen && (
              <form className="px-4 pb-5 pt-2 space-y-5" onSubmit={handleSecuritySubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input-field pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                      >
                        <iconify-icon icon={showCurrentPw ? 'material-symbols:visibility-off' : 'material-symbols:visibility'}></iconify-icon>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        aria-label={showNewPw ? 'Hide password' : 'Show password'}
                      >
                        <iconify-icon icon={showNewPw ? 'material-symbols:visibility-off' : 'material-symbols:visibility'}></iconify-icon>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Confirm New</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                      >
                        <iconify-icon icon={showConfirmPw ? 'material-symbols:visibility-off' : 'material-symbols:visibility'}></iconify-icon>
                      </button>
                    </div>
                  </div>
                </div>

                {securityError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <iconify-icon icon="material-symbols:error"></iconify-icon> {securityError}
                  </p>
                )}
                {securitySuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <iconify-icon icon="material-symbols:check-circle"></iconify-icon> {securitySuccess}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={securitySubmitting}
                    className="px-8 py-2 bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all"
                  >
                    {securitySubmitting ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors group text-left">
              <div className="w-9 h-9 rounded-xl bg-white/5 text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-[#ef233c] transition-colors">
                <iconify-icon icon="material-symbols:logout"></iconify-icon>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Log Out</p>
                <p className="text-[11px] text-zinc-500">End this session</p>
              </div>
            </button>
          </div>

          {/* Activity Log: real data, built by merging simulation results
              and training completions — see utils/activityLog.js */}
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold font-manrope mb-6">Activity Log</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {activity.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-6">
                  No activity yet. Complete a{' '}
                  <Link to="/simulations" className="text-[#ef233c] hover:underline">
                    simulation
                  </Link>{' '}
                  or{' '}
                  <Link to="/training" className="text-[#ef233c] hover:underline">
                    training lesson
                  </Link>{' '}
                  to see it here.
                </p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${COLOR_CLASSES[item.color]}`}>
                      <iconify-icon icon={item.icon}></iconify-icon>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-200">{item.text}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 border-red-900/20">
            <h3 className="text-xl font-bold font-manrope mb-8 text-[#ef233c]">Delete Account</h3>
            {/* Not wired up — this is a demo, so deleting an account isn't implemented */}
            <button className="w-full px-8 py-4 rounded-2xl bg-red-600/10 border border-red-600/20 hover:bg-red-600 hover:text-white text-[#ef233c] font-bold transition-all flex items-center justify-center gap-2">
              <iconify-icon icon="material-symbols:delete"></iconify-icon> Delete Account
            </button>
            <p className="text-xs text-zinc-500 mt-4 flex items-start gap-2">
              <iconify-icon icon="material-symbols:warning" className="text-[#ef233c] mt-0.5 shrink-0"></iconify-icon>
              Once deleted, everything is lost for good — your account, your organization membership, and all your stats
              (simulation results and training progress). This can't be undone.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
