// This is the "map" of the whole app: every URL (route) and which page
// component shows for it. It also sets up the two app-wide Contexts
// (AuthProvider for "who's logged in", OrgProvider for "company data") so
// every page inside can use them.
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import { ROLES } from './data/roles';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ThreatIntel from './pages/ThreatIntel';
import DemoTraining from './pages/DemoTraining';
import DemoSimulation from './pages/DemoSimulation';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import CampaignResults from './pages/CampaignResults';
import AdminDashboard from './pages/AdminDashboard';
import OrgReport from './pages/OrgReport';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import PlatformAdmin from './pages/PlatformAdmin';
import OrgDetail from './pages/OrgDetail';
import MySimulations from './pages/MySimulations';
import SimulationPlayer from './pages/SimulationPlayer';
import UserDashboard from './pages/UserDashboard';
import Training from './pages/Training';
import LessonPage from './pages/LessonPage';
import PhishingIntro from './pages/PhishingIntro';
import TrainingQuiz from './pages/TrainingQuiz';

export default function App() {
  return (
    // Everything inside these two Providers can access "who's logged in"
    // (useAuth) and "company data" (useOrg) — see context/AuthContext.jsx
    // and context/OrgContext.jsx.
    <AuthProvider>
      <OrgProvider>
        <Routes>
          {/* Layout (nav bar + footer) wraps every single page below. */}
          <Route element={<Layout />}>
            {/* Public pages — anyone can visit these, logged in or not. */}
            <Route path="/" element={<Home />} />
            <Route path="/threat-intel" element={<ThreatIntel />} />
            <Route path="/demo" element={<DemoTraining />} />
            <Route path="/demo/simulation" element={<DemoSimulation />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* Org Admin only — managing one company. */}
            <Route element={<ProtectedRoute roles={[ROLES.ORG_ADMIN]} />}>
              <Route path="/campaigns" element={<CampaignResults />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/report" element={<OrgReport />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

            {/* Platform Admin only — ClickWise's own staff. */}
            <Route element={<ProtectedRoute roles={[ROLES.PLATFORM_ADMIN]} />}>
              <Route path="/platform-admin" element={<PlatformAdmin />} />
              <Route path="/platform-admin/orgs/:orgId" element={<OrgDetail />} />
            </Route>

            {/* Org Admins AND Employees — simulations and training lessons. */}
            <Route element={<ProtectedRoute roles={[ROLES.ORG_ADMIN, ROLES.EMPLOYEE]} />}>
              <Route path="/simulations" element={<MySimulations />} />
              <Route path="/simulations/:simId" element={<SimulationPlayer />} />
              <Route path="/training/intro" element={<PhishingIntro />} />
              <Route path="/training" element={<Training />} />
              <Route path="/training/quiz" element={<TrainingQuiz />} />
              <Route path="/training/:lessonId" element={<LessonPage />} />
            </Route>

            {/* Employees only — their personal dashboard. */}
            <Route element={<ProtectedRoute roles={[ROLES.EMPLOYEE]} />}>
              <Route path="/dashboard" element={<UserDashboard />} />
            </Route>

            {/* Any logged-in role — the account/profile settings page. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </OrgProvider>
    </AuthProvider>
  );
}
