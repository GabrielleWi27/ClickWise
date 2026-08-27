// The one free lesson + one free simulation anyone can try without an
// account. Deliberately NOT part of the real 18-lesson/18-simulation
// library (those live in Supabase and require sign-in) — this is static,
// hardcoded content so the public demo works instantly with no auth, no
// database round-trip, and no progress to save anywhere.
export const DEMO_LESSON = {
  id: 'demo-lesson',
  title: 'The 60-Second Phishing Instinct',
  summary: 'A fast, no-fluff primer on the handful of signals that give away almost every phishing email.',
  minutes: 3,
  sections: [
    {
      heading: 'Why phishing still works',
      body: [
        "Phishing doesn't need to fool everyone — it just needs to catch you on a busy day, mid-multitask, moving fast. Attackers design emails to short-circuit careful thinking by manufacturing urgency: an account about to lock, a payment about to fail, a deadline about to pass.",
        "The good news: once you know what to check, spotting a fake takes seconds, not minutes.",
      ],
    },
    {
      heading: 'The four-second checklist',
      body: [
        'Sender — does the actual email address match the organization it claims to be from, or is it a lookalike domain?',
        'Urgency — is the message pressuring you to act immediately, before you have time to verify?',
        'Link — before clicking anything, does the destination (visible on hover) actually match where it claims to take you?',
        'Ask — is it requesting something a legitimate message never would, like a password, a gift card, or a wire transfer?',
      ],
    },
    {
      heading: 'What to do when something feels off',
      body: [
        "Don't click, don't reply, and don't forward it to \"check with someone\" — just report it through your organization's official channel.",
        'If it claims to be from a real service (your bank, your IT team, a delivery company), navigate to that service directly through a browser bookmark or a quick search — never through a link in the message itself.',
      ],
    },
  ],
  keyTakeaways: [
    'Mismatched sender domains are the single most common phishing tell.',
    'Manufactured urgency is a manipulation tactic, not a reason to skip verification.',
    'Hover before you click — the visible link text and the real destination are often different.',
    'Reporting a suspicious email is always safer than "just checking" by clicking it.',
  ],
};

// The one fake phishing email shown on the public "Try Demo" simulation
// page — same shape as a real row from the `simulations` table.
export const DEMO_SIMULATION = {
  id: 'demo-simulation',
  name: 'IT Helpdesk Password Reset',
  category: 'Free Preview',
  difficulty: 'Low',
  sender: 'IT-Support@corp-helpdesk-secure.com',
  subject: 'Action Required: Your password expires in 2 hours',
  body: [
    'Hi there,',
    'Our records show your network password is set to expire in 2 hours. To avoid being locked out of your email, VPN, and shared drives, please verify your credentials immediately using the secure link below.',
    "This is an automated message — if you don't act before the deadline, you will need to submit a manual unlock request, which can take up to 3 business days to process.",
  ],
  ctaLabel: 'Reset Password Now',
  redFlags: [
    'The sender domain ("corp-helpdesk-secure.com") is not your organization\'s real domain — a classic lookalike.',
    'A tight, arbitrary deadline ("2 hours") is designed to make you act before you think to verify.',
    'A generic greeting ("Hi there") instead of your actual name — real IT tickets are usually personalized.',
    'The threat of a costly consequence (a multi-day lockout) pressures you into skipping verification.',
    'Legitimate password resets are almost never initiated by an unsolicited email with an embedded link.',
  ],
};
