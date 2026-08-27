// This file keeps track of "who is currently logged in" for the WHOLE app.
//
// Normally, passing information between components in React means passing
// it down as props through every layer in between. A "Context" is React's
// way of skipping that — any component anywhere in the app can ask
// "who's logged in?" directly, without every page in between needing to
// pass that info along manually.
//
// Real accounts now live in Supabase Auth, with a matching row in the
// `profiles` table (role, organization, department, etc.) — this file's
// job is to combine those two into the single `user` shape every page
// already expects: { id, name, email, role, orgId, department, status, riskScore, mustChangePassword }.
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

// Looks up the `profiles` row for a Supabase Auth user and reshapes it
// into the flat `user` object every page reads (user.role, user.orgId, etc).
async function loadProfile(authUser) {
  if (!authUser) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
  if (error || !data) return null;
  return {
    id: authUser.id,
    name: data.name,
    email: data.email,
    role: data.role,
    orgId: data.org_id,
    department: data.department,
    status: data.status,
    riskScore: data.risk_score,
    mustChangePassword: data.must_change_password,
    avatarUrl: data.avatar_url,
    watchedPhishingIntro: data.watched_phishing_intro,
  };
}

// Wraps the whole app (see App.jsx) so every page inside it can read and
// change who's logged in via the useAuth() hook below.
export function AuthProvider({ children }) {
  // `user` holds the logged-in person's info, or `null` if nobody's logged in.
  const [user, setUser] = useState(null);
  // True only while we're checking for an existing session on first load —
  // lets ProtectedRoute avoid bouncing someone to Sign In before we've had
  // a chance to find out they're actually already logged in.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // On first load, ask Supabase if there's already a valid session saved
    // (e.g. the user refreshed the page or came back later).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profile = await loadProfile(session?.user ?? null);
      if (isMounted) {
        setUser(profile);
        setLoading(false);
      }
    });

    // Keep `user` in sync any time Supabase's own auth state changes
    // (sign in, sign out, token refresh) from anywhere in the app.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = await loadProfile(session?.user ?? null);
      if (isMounted) setUser(profile);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Signs someone in for real against Supabase Auth. Throws on failure
  // (wrong email/password) so the Sign In page can show a real error
  // instead of always succeeding like the old fake login did.
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await loadProfile(data.user);
    setUser(profile);
    return profile;
  };

  // Ends the Supabase session and clears the locally-held user right away
  // (rather than waiting for the onAuthStateChange listener above).
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Sets a new password for the current account, and clears the "please
  // change your password" flag for anyone who was created with the shared
  // default password by their org admin.
  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    if (user?.mustChangePassword) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id);
    }
    await refreshProfile();
  };

  // Flips the one-time flag that unlocks Training — called only once, when
  // the "What Is Phishing?" intro animation finishes playing.
  const markPhishingIntroWatched = async () => {
    await supabase.from('profiles').update({ watched_phishing_intro: true }).eq('id', user.id);
    await refreshProfile();
  };

  // Re-reads this user's `profiles` row from the database — used right
  // after an action that changes it server-side (like finishing Sign Up,
  // which attaches a brand new organization to the account).
  const refreshProfile = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const profile = await loadProfile(authUser);
    setUser(profile);
    return profile;
  };

  return (
    <AuthContext.Provider
      value={{ user, loggedIn: !!user, loading, login, logout, refreshProfile, changePassword, markPhishingIntroWatched }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// The hook every page/component uses to read the logged-in user or call
// login()/logout() — e.g. `const { user, loggedIn, login, logout } = useAuth();`
export function useAuth() {
  return useContext(AuthContext);
}
