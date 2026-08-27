// This file describes the "Content Library" that Platform Admins (ClickWise
// staff) maintain — the pool of campaigns, demos, and training items that
// can be assigned to any company using the platform. The actual library
// items live in the `content_library` table now; this file just holds the
// shared constants/styling every page that touches content needs.

// The 3 kinds of content a platform admin can create.
export const CONTENT_TYPES = {
  CAMPAIGN: 'campaign', // a phishing simulation template
  DEMO: 'demo', // a sales/onboarding walkthrough
  TRAINING: 'training', // an educational module
};

// Friendly plural names shown as tab labels on the Platform Admin page.
export const CONTENT_TYPE_LABELS = {
  [CONTENT_TYPES.CAMPAIGN]: 'Campaigns',
  [CONTENT_TYPES.DEMO]: 'Demos',
  [CONTENT_TYPES.TRAINING]: 'Trainings',
};

// Tailwind CSS classes for each difficulty badge's color.
const DIFFICULTY_STYLE = {
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  High: 'bg-red-500/10 text-[#ef233c] border-red-500/20',
};

// Looks up the right badge color for a difficulty level. Defaults to the
// "Medium" color if an unrecognized level is passed in, so nothing breaks.
export function difficultyStyle(level) {
  return DIFFICULTY_STYLE[level] ?? DIFFICULTY_STYLE.Medium;
}
