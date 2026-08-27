// The step content shown by the first-login welcome tour (see
// components/OnboardingTour.jsx). Split per role since an Employee, an Org
// Admin, and a Platform Admin land on completely different dashboards with
// different first things to learn.
import { ROLES } from './roles';

// Each array below is one slide deck — the tour just shows these in
// order, one at a time, with a "Next" button (see OnboardingTour.jsx).

// What a regular Employee sees on their very first login.
const EMPLOYEE_STEPS = [
  {
    icon: 'material-symbols:waving-hand',
    title: 'Welcome to ClickWise',
    body: "You're here to build one habit: spot a phishing email before it costs you. This takes about 30 seconds to walk through.",
  },
  {
    icon: 'material-symbols:school',
    title: 'Start with Training',
    body: 'Head to Training for short, focused lessons. Each one unlocks a matching simulation once you finish it.',
  },
  {
    icon: 'material-symbols:gpp-maybe',
    title: 'Then try a Simulation',
    body: "Simulations are real, realistic phishing emails — completely safe to practice on. Report, click, or ignore, and we'll show you what gave it away.",
  },
  {
    icon: 'material-symbols:military-tech',
    title: 'Track your progress',
    body: 'Your Dashboard shows how far along you are, and once you finish every lesson with a strong pass rate, you can download a completion certificate.',
  },
];

// What a brand-new Org Admin (someone who just signed up their company) sees.
const ORG_ADMIN_STEPS = [
  {
    icon: 'material-symbols:waving-hand',
    title: 'Welcome to ClickWise',
    body: "You're set up as your organization's admin. Here's what to do first.",
  },
  {
    icon: 'material-symbols:group-add',
    title: 'Add your team',
    body: "Anyone who signs up with your company's email domain joins automatically — or add members directly from your Dashboard.",
  },
  {
    icon: 'material-symbols:rocket-launch',
    title: 'Launch a campaign',
    body: "Add Campaign to send a real phishing simulation to your team and see who's ready — and who needs more training.",
  },
  {
    icon: 'material-symbols:monitoring',
    title: 'Watch your risk score',
    body: 'Reports shows org-wide trends, department risk, and click/report rates — all computed live from real results.',
  },
];

// What a ClickWise staff member (Platform Admin) sees.
const PLATFORM_ADMIN_STEPS = [
  {
    icon: 'material-symbols:waving-hand',
    title: 'Welcome back',
    body: "You're signed in as Platform Admin — you manage ClickWise's content library and every organization on the platform.",
  },
  {
    icon: 'material-symbols:library-books',
    title: 'Manage the content library',
    body: 'Enable or disable simulations, review lessons, and manage demo content from your Dashboard.',
  },
  {
    icon: 'material-symbols:corporate-fare',
    title: 'Oversee every organization',
    body: "View any organization's real dashboard — members, campaigns, and risk data — read-only, exactly as their own admin sees it.",
  },
];

// Picks the right slide deck for whoever is logged in.
export const TOUR_STEPS_BY_ROLE = {
  [ROLES.EMPLOYEE]: EMPLOYEE_STEPS,
  [ROLES.ORG_ADMIN]: ORG_ADMIN_STEPS,
  [ROLES.PLATFORM_ADMIN]: PLATFORM_ADMIN_STEPS,
};
