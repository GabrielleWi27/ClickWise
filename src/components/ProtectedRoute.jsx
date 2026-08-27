// This is the "bouncer" for pages that need you to be logged in — and,
// optionally, logged in with a specific role (like Org Admin only).
// It's used in App.jsx to wrap groups of routes, e.g.:
//   <Route element={<ProtectedRoute roles={[ROLES.ORG_ADMIN]} />}>
//     <Route path="/admin" element={<AdminDashboard />} />
//   </Route>
// Anything nested inside only renders if the checks below pass.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/roles';

// Where to send someone if they're logged in but don't have the right
// role for the page they tried to visit — their own "home" page instead.
const ROLE_HOME = {
  [ROLES.PLATFORM_ADMIN]: '/platform-admin',
  [ROLES.ORG_ADMIN]: '/admin',
  [ROLES.EMPLOYEE]: '/dashboard',
};

// `roles` is an optional list of allowed roles for this group of pages.
// If it's left out, any logged-in user (regardless of role) is let through.
export default function ProtectedRoute({ roles }) {
  const { user, loggedIn, loading } = useAuth();
  const location = useLocation();

  // Still checking whether a session already exists (e.g. right after a
  // page refresh) — wait rather than bouncing someone to Sign In who is
  // actually already logged in.
  if (loading) {
    return null;
  }

  // Not logged in at all -> send to Sign In. We remember which page they
  // were trying to reach (`state={{ from: location }}`) so Sign In can
  // send them right back there afterward.
  if (!loggedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Logged in, but their role isn't allowed here -> send them to their
  // own home page instead of showing an error.
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
  }

  // All checks passed — render whatever page was actually requested.
  // <Outlet /> is React Router's placeholder for "the nested route here".
  return <Outlet />;
}
