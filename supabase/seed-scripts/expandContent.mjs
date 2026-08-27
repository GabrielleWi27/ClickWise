// One-off script: adds 12 more phishing simulations and 12 more training
// lessons to the real `simulations`/`lessons` tables. Unlike
// generateContent.mjs, this doesn't call the Anthropic API (that needs
// paid credits) — the content below was written directly, then this
// script just handles giving everything a unique id/order_index and
// inserting it.
//
// Usage:
//   1. Fill in VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in your .env
//   2. node supabase/seed-scripts/expandContent.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

function makeUniqueId(prefix, name, takenIds) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  let id = `${prefix}_${slug}`;
  let n = 2;
  while (takenIds.has(id)) {
    id = `${prefix}_${slug}-${n}`;
    n += 1;
  }
  takenIds.add(id);
  return id;
}

const NEW_SIMULATIONS = [
  {
    name: 'Executive Wire Transfer Request',
    category: 'Executive Impersonation',
    difficulty: 'High',
    sender: 'CEO Office <ceo.office@clickwise-exec-mail.com>',
    subject: "Urgent - Need you to process a wire transfer today",
    body: [
      "Hi,",
      "I'm in back-to-back meetings and can't take calls right now. I need you to process an urgent wire transfer to a new vendor before end of day — this is time-sensitive and confidential, so please don't loop in anyone else yet.",
      "Reply here and I'll send the account details.",
      'Sent from my iPhone',
    ],
    cta_label: 'Click "Reply to CEO"',
    red_flags: [
      'A slightly wrong domain (clickwise-exec-mail.com) instead of the real company domain.',
      "Pressure to act fast and keep it \"confidential\" — a classic way to stop you from verifying with anyone else.",
      '"Sent from my iPhone" is a common trick to explain away typos or an unusual writing style.',
      'Real executives rarely request wire transfers over email with no other verification.',
    ],
  },
  {
    name: 'Vendor Bank Details Update',
    category: 'Vendor Fraud',
    difficulty: 'High',
    sender: 'Accounts Payable <ap@globalsupply-partners.com>',
    subject: 'Updated banking details for upcoming payment',
    body: [
      'Hello,',
      'Please note that our banking details have changed as of this week. Kindly update our vendor record with the new account information attached before processing any further payments.',
      'Let us know once updated.',
      'Accounts Team',
    ],
    cta_label: 'Open "New_Bank_Details.pdf"',
    red_flags: [
      'A request to change payment details always needs verification through a known phone number, never just an email.',
      'Generic "Accounts Team" signature instead of a real contact person.',
      "Creates a sense that payment will be delayed if you don't act quickly.",
    ],
  },
  {
    name: 'MFA Approval Spam',
    category: 'MFA Fatigue',
    difficulty: 'Medium',
    sender: 'IT Security <no-reply@clickwise-mfa-alerts.com>',
    subject: 'Multiple sign-in approval requests pending',
    body: [
      "We've noticed several authentication requests waiting for your approval.",
      'If you did not initiate these requests, approve one anyway to dismiss this notice and secure your account.',
      'IT Security',
    ],
    cta_label: 'Click "Approve All Requests"',
    red_flags: [
      "Real security guidance is the opposite: never approve an MFA request you didn't initiate.",
      'Telling you to approve a request "to dismiss this notice" is designed to trick you into granting access.',
      "Legitimate IT teams don't email you to approve unknown sign-in attempts.",
    ],
  },
  {
    name: 'Shared Document Notification',
    category: 'Credential Harvest',
    difficulty: 'Medium',
    sender: 'Cloud Drive <notifications@securedocs-share.net>',
    subject: '"Q3 Budget Review" has been shared with you',
    body: [
      'A document titled "Q3 Budget Review" has been shared with you by a colleague.',
      'Sign in with your work email to view the file. This link expires in 24 hours.',
      'Cloud Drive Notifications',
    ],
    cta_label: 'Click "View Document"',
    red_flags: [
      "An unfamiliar sharing domain instead of your company's actual cloud storage provider.",
      'Being asked to "sign in" again for a document link is a common credential-harvesting trick.',
      'An artificial 24-hour expiry to rush you into clicking without checking.',
    ],
  },
  {
    name: 'Charity Donation Match',
    category: 'Financial Lure',
    difficulty: 'Low',
    sender: 'People Team <people@clickwise-giving.org>',
    subject: 'Company will double your donation this week only',
    body: [
      'Hi Team,',
      'This week only, the company will match every employee donation dollar-for-dollar. Click below to make your donation and have it matched instantly.',
      'People Team',
    ],
    cta_label: 'Click "Donate Now"',
    red_flags: [
      'An unfamiliar ".org" domain not connected to your real company.',
      'A limited-time offer designed to make you act before thinking it through.',
      'Real donation-matching programs are usually announced and run through your actual HR systems, not a one-off email link.',
    ],
  },
  {
    name: 'Expense Report Rejected',
    category: 'Financial Lure',
    difficulty: 'Medium',
    sender: 'Finance Team <finance@clickwise-expense-portal.com>',
    subject: 'Your expense report was rejected - action needed',
    body: [
      'Your most recent expense report submission was rejected due to a formatting issue.',
      'Please log in to correct and resubmit your report before the end of the pay period, or reimbursement may be delayed.',
      'Finance Team',
    ],
    cta_label: 'Click "Review Expense Report"',
    red_flags: [
      "A look-alike \"expense-portal\" domain instead of your real finance system's address.",
      'Threatens a delayed reimbursement to pressure quick action.',
      'No specific detail about which expense report or what the formatting issue actually was.',
    ],
  },
  {
    name: 'New Hire Onboarding Checklist',
    category: 'Attachment Bait',
    difficulty: 'Low',
    sender: 'HR Onboarding <onboarding@clickwise-hr-systems.com>',
    subject: 'Complete your onboarding checklist',
    body: [
      'Welcome to the team!',
      'Please review and complete the attached onboarding checklist, including your tax and direct deposit forms, within your first three days.',
      'HR Onboarding Team',
    ],
    cta_label: 'Open "Onboarding_Checklist.docm"',
    red_flags: [
      'The attachment is a macro-enabled Word file (.docm), a common way to deliver malware.',
      "If you weren't expecting an onboarding email (e.g. you're not new), that's an immediate red flag.",
      'A generic "HR Onboarding Team" rather than a named HR contact.',
    ],
  },
  {
    name: 'Voicemail Transcription',
    category: 'Attachment Bait',
    difficulty: 'Low',
    sender: 'Voicemail System <voicemail@clickwise-vm-notify.com>',
    subject: 'You have a new voicemail (0:47)',
    body: [
      'You have received a new voicemail message.',
      'Click below to listen to your message or view the transcription.',
      'This is an automated notification.',
    ],
    cta_label: 'Click "Play Voicemail"',
    red_flags: [
      'An unfamiliar domain for what should be an internal phone system notification.',
      'Voicemail links are a common cover for credential-harvesting or malware pages.',
      'No caller ID or number is included — real voicemail notifications almost always show one.',
    ],
  },
  {
    name: 'Software License Expiring',
    category: 'Credential Harvest',
    difficulty: 'Medium',
    sender: 'License Admin <licensing@clickwise-software-renew.com>',
    subject: 'Your software license expires in 3 days',
    body: [
      'Your company software license is set to expire in 3 days.',
      'To avoid losing access, please verify your account and renew your license using the link below.',
      'License Administration',
    ],
    cta_label: 'Click "Verify & Renew"',
    red_flags: [
      'An urgency-driven deadline ("3 days") designed to prevent careful checking.',
      '"Verify your account" before renewing is a classic credential-harvesting phrase.',
      'Software license renewals are normally handled by IT centrally, not through a personal email link.',
    ],
  },
  {
    name: 'Survey Reward Gift Card',
    category: 'Financial Lure',
    difficulty: 'Low',
    sender: 'Employee Experience <survey@clickwise-feedback-rewards.com>',
    subject: 'Complete a 2-minute survey, get a $25 gift card',
    body: [
      'We value your feedback!',
      'Complete this quick 2-minute survey about your work experience and receive a $25 gift card as a thank-you.',
      'Employee Experience Team',
    ],
    cta_label: 'Click "Start Survey"',
    red_flags: [
      'An unusually generous reward for a short survey is designed to override normal caution.',
      "An unfamiliar \"rewards\" domain unrelated to your real company's survey tools.",
      'Legitimate internal surveys are typically announced ahead of time, not sent cold with a cash incentive.',
    ],
  },
  {
    name: 'Contract Signature Request',
    category: 'Credential Harvest',
    difficulty: 'High',
    sender: 'DocuSign Notification <no-reply@docusign-secure-verify.com>',
    subject: 'Please review and sign: Vendor Services Agreement',
    body: [
      'You have a document waiting for your signature: "Vendor Services Agreement."',
      'Please review and sign electronically by end of day to avoid delays in the agreement process.',
      'This is an automated message from your document signing service.',
    ],
    cta_label: 'Click "Review & Sign"',
    red_flags: [
      'A look-alike domain ("docusign-secure-verify.com") instead of the real signing service\'s domain.',
      "You weren't expecting this document, or don't recognize the agreement being referenced.",
      'Pressure to sign "by end of day" is meant to rush you past careful review.',
    ],
  },
  {
    name: 'QR Code Parking Validation',
    category: 'Attachment Bait',
    difficulty: 'Medium',
    sender: 'Facilities Team <facilities@clickwise-building-services.com>',
    subject: 'Scan to validate your parking - new system live today',
    body: [
      'Starting today, parking validation has moved to a QR code system.',
      'Scan the attached QR code with your phone and log in with your work credentials to validate your parking for this month.',
      'Facilities Team',
    ],
    cta_label: 'Scan the attached QR code',
    red_flags: [
      'QR codes hide the real destination URL until after you scan them, making them harder to check first.',
      'Being asked to "log in with your work credentials" for something as simple as parking validation is unusual.',
      'A sudden, unannounced change to a routine process is a common way attackers create confusion and urgency.',
    ],
  },
];

const NEW_LESSONS = [
  {
    title: 'Recognizing Business Email Compromise (BEC)',
    summary: 'Learn how attackers impersonate executives and coworkers to trick you into moving money or data.',
    minutes: 5,
    sections: [
      {
        heading: 'What makes BEC different from ordinary phishing',
        body: [
          "Business Email Compromise doesn't rely on malware or fake login pages — it's pure social engineering. The attacker impersonates someone you trust (a CEO, a vendor, a coworker) and asks for something that sounds like a normal, if urgent, business request: a wire transfer, a gift card purchase, or a change to payment details.",
        ],
      },
      {
        heading: 'The "unavailable" excuse',
        body: [
          'A common pattern is a message claiming the sender is in a meeting, traveling, or otherwise unreachable by phone — conveniently removing the easiest way to verify the request. Treat "I can\'t talk right now, just reply here" as a reason to verify more carefully, not less.',
        ],
      },
      {
        heading: 'Verify through a second channel, every time',
        body: [
          'Before acting on any request involving money, credentials, or sensitive data, confirm it through a channel you already know is real — a phone call to a number you looked up yourself, not one provided in the message. This single habit stops the overwhelming majority of BEC attempts.',
        ],
      },
      {
        heading: 'When the request seems unusual for that person',
        body: [
          "If a request doesn't match how someone normally communicates — the wrong tone, skipping their usual approval process, unusual urgency — trust that instinct. Attackers study public information about your company, but they can't perfectly imitate internal habits.",
        ],
      },
    ],
    key_takeaways: [
      "BEC uses impersonation and urgency, not malware — it's designed to look like a normal business request.",
      '"I\'m unreachable, just reply here" is a red flag, not a legitimate excuse.',
      'Always verify money or data requests through a separate, known channel.',
      "Trust your instinct when a request doesn't match how someone normally communicates.",
    ],
  },
  {
    title: 'Staying Safe on Public Wi-Fi',
    summary: 'Practical habits for working securely from cafes, airports, and other shared networks.',
    minutes: 4,
    sections: [
      {
        heading: 'Why public networks are riskier',
        body: [
          'On a shared network, anyone else connected — including an attacker — may be able to intercept unencrypted traffic or set up a fake network with a convincing name. You generally have no way to verify who actually controls the network you just joined.',
        ],
      },
      {
        heading: 'Use a VPN for work traffic',
        body: [
          "If your company provides a VPN, use it whenever you're on a network you don't control. It encrypts your connection end-to-end, so even a malicious network operator only sees scrambled traffic.",
        ],
      },
      {
        heading: 'Watch for fake network names',
        body: [
          'Attackers sometimes set up a network named to look official ("Airport_Free_WiFi" instead of the real "Airport-WiFi"). When possible, confirm the exact network name with staff rather than guessing.',
        ],
      },
      {
        heading: 'Avoid sensitive actions on unfamiliar networks',
        body: [
          'Save banking, password changes, or anything highly sensitive for a network you trust — your home connection or your phone\'s own cellular data — rather than doing it on public Wi-Fi even with a VPN, as an extra layer of caution.',
        ],
      },
    ],
    key_takeaways: [
      "Public Wi-Fi means you can't verify who else is on the network.",
      'Use your company VPN whenever available on an untrusted network.',
      'Double-check network names — fake look-alike networks are common.',
      'Save your most sensitive actions for a network you actually trust.',
    ],
  },
  {
    title: 'Physical Security and Tailgating',
    summary: 'Security isn\'t only digital — learn to spot and stop unauthorized physical access.',
    minutes: 3,
    sections: [
      {
        heading: 'What tailgating looks like',
        body: [
          "Tailgating is when someone without proper access follows closely behind an authorized person through a secure door — often while carrying something (boxes, coffee) that makes it awkward to challenge them, or claiming to have forgotten their badge.",
        ],
      },
      {
        heading: "It's okay to ask",
        body: [
          "Politely asking someone to badge in themselves, even if it feels uncomfortable, is completely normal security practice — not rude. Most organizations would rather you ask an authorized colleague to swipe twice than let an unverified person in.",
        ],
      },
      {
        heading: 'Visitors and contractors',
        body: [
          'Anyone without a visible badge in a secure area — including someone claiming to be a technician or delivery person — should be directed to reception or a manager rather than let in directly, no matter how routine the request sounds.',
        ],
      },
    ],
    key_takeaways: [
      "Tailgating relies on you feeling too awkward to say something — it's fine to ask.",
      'Never let someone into a secure area just because they claim to have forgotten their badge.',
      'Direct unbadged visitors or contractors to reception rather than escorting them in yourself.',
    ],
  },
  {
    title: 'Protecting Data on Mobile Devices',
    summary: 'Your phone holds as much sensitive data as your laptop — treat it with the same care.',
    minutes: 4,
    sections: [
      {
        heading: 'Lock screens are non-negotiable',
        body: [
          "A phone without a passcode or biometric lock gives anyone who picks it up — lost, stolen, or momentarily unattended — instant access to email, messaging, and often saved passwords. Always enable a lock screen, even if it feels like a minor inconvenience.",
        ],
      },
      {
        heading: 'Only install apps you actually need',
        body: [
          "Every app you install is a piece of software with some level of access to your device. Stick to official app stores, and be skeptical of apps that ask for permissions unrelated to what they do (a flashlight app asking for your contacts, for example).",
        ],
      },
      {
        heading: 'Report a lost or stolen device immediately',
        body: [
          "If a work device is lost or stolen, report it to IT right away so they can remotely lock or wipe it if needed. The sooner it's reported, the smaller the window an attacker has to access anything on it.",
        ],
      },
    ],
    key_takeaways: [
      'Always use a lock screen on any device that touches work email or accounts.',
      'Only install apps from official stores, and question unnecessary permission requests.',
      'Report a lost or stolen device to IT immediately, even if you think it will turn up.',
    ],
  },
  {
    title: 'Understanding Ransomware',
    summary: 'How ransomware spreads, and the habits that keep one bad click from becoming a company-wide incident.',
    minutes: 5,
    sections: [
      {
        heading: 'How it usually gets in',
        body: [
          'Most ransomware starts the same way as everything else in this training: a phishing email with a malicious attachment or link. Once opened, it can quietly encrypt files — sometimes on your device alone, sometimes spreading across connected network drives — before ever displaying a ransom note.',
        ],
      },
      {
        heading: 'Backups are the real defense',
        body: [
          "The single most effective protection against ransomware is having backups that are truly separate from your everyday systems, so an attacker who encrypts your live files can't also encrypt the backup. This is largely an IT responsibility, but it's why IT cares so much about which files live where.",
        ],
      },
      {
        heading: 'What to do if you suspect an infection',
        body: [
          'If files suddenly become inaccessible, rename themselves strangely, or you see a ransom message, disconnect the device from the network immediately (Wi-Fi off, cable unplugged) and contact IT right away — don\'t wait to see if it resolves itself, and don\'t attempt to pay or negotiate yourself.',
        ],
      },
    ],
    key_takeaways: [
      'Ransomware usually starts with the same phishing tactics covered elsewhere in this training.',
      "Separate, offline-style backups are what actually make ransomware recoverable rather than catastrophic.",
      'Disconnect from the network and contact IT immediately if you suspect an infection.',
      "Never attempt to pay or negotiate with attackers yourself.",
    ],
  },
  {
    title: 'Safe File Sharing and Cloud Storage',
    summary: 'Share files without accidentally handing access to people who shouldn\'t have it.',
    minutes: 4,
    sections: [
      {
        heading: 'Check who a link is really shared with',
        body: [
          '"Anyone with the link can view" is convenient but means exactly what it says — the file is accessible to anyone the link reaches, including if it\'s forwarded, posted somewhere public, or intercepted. Prefer sharing with specific named people whenever the content is sensitive.',
        ],
      },
      {
        heading: 'Review sharing permissions periodically',
        body: [
          'Files shared months or years ago for a project that has since ended often stay shared indefinitely unless someone actively revokes access. Periodically reviewing and cleaning up old shares reduces how much sensitive data is quietly exposed.',
        ],
      },
      {
        heading: 'Use company-approved storage, not personal accounts',
        body: [
          'Uploading work files to a personal cloud storage account to "make sharing easier" moves that data outside your company\'s security controls and backup/retention policies entirely. Stick to the storage platform your organization actually provides.',
        ],
      },
    ],
    key_takeaways: [
      '"Anyone with the link" sharing should be reserved for genuinely non-sensitive files.',
      'Periodically review and revoke old, no-longer-needed sharing permissions.',
      "Never move work files to a personal cloud account for convenience.",
    ],
  },
  {
    title: 'Spotting Deepfakes and Voice Cloning Scams',
    summary: 'AI-generated audio and video are making impersonation attacks harder to spot by ear or eye alone.',
    minutes: 4,
    sections: [
      {
        heading: 'What\'s changed',
        body: [
          "Voice cloning tools can now recreate a convincing approximation of someone's voice from a short public sample — a conference talk, a podcast appearance, a video call recording. This has extended classic phone-based impersonation scams (\"it's your boss, I need a favor\") into a much more convincing form.",
        ],
      },
      {
        heading: 'Urgency is still the giveaway',
        body: [
          'Even a well-cloned voice or video usually comes wrapped in the same urgency and secrecy patterns as email-based BEC scams: a request that can\'t wait, that can\'t be discussed with anyone else, and that conveniently avoids normal approval steps.',
        ],
      },
      {
        heading: 'Verify out-of-band',
        body: [
          "If a call or video request involves money, credentials, or sensitive data, hang up and call back on a number you already have on file — not one given to you during the call. This defeats voice cloning just as effectively as it defeats email impersonation.",
        ],
      },
    ],
    key_takeaways: [
      'Voice cloning can convincingly imitate a real person from short public audio samples.',
      "Urgency and secrecy are still the tell, even when the voice sounds completely real.",
      'Always verify unusual requests by calling back a number you already trust, not one given to you in the moment.',
    ],
  },
  {
    title: 'Vendor and Third-Party Risk Awareness',
    summary: 'Your security is only as strong as the vendors and partners you connect it to.',
    minutes: 4,
    sections: [
      {
        heading: 'Why vendors are a common attack path',
        body: [
          'Attackers often find it easier to compromise a smaller vendor with weaker security than to attack a well-defended company directly — then use that vendor\'s trusted access or email relationship to reach the real target. This is exactly the pattern behind the "Vendor Bank Details Update" simulation.',
        ],
      },
      {
        heading: 'Verify changes to vendor information',
        body: [
          'Any request to change a vendor\'s payment details, contact information, or access credentials deserves the same scrutiny as an internal request — confirm it through a known, separate channel before acting.',
        ],
      },
      {
        heading: 'Limit access to what\'s actually needed',
        body: [
          "When granting a vendor or contractor system access, give them only what's required for their specific task, for only as long as it's needed. This limits how much damage a compromised vendor account can actually do.",
        ],
      },
    ],
    key_takeaways: [
      'Vendors and partners are a common indirect path attackers use to reach your organization.',
      "Treat vendor requests to change payment or contact details with the same caution as internal ones.",
      "Grant vendor access on a minimum-necessary, time-limited basis.",
    ],
  },
  {
    title: 'Secure Remote Work Practices',
    summary: 'Keep the same security habits at home that you\'d follow in the office.',
    minutes: 4,
    sections: [
      {
        heading: 'Secure your home network',
        body: [
          "Change default router passwords, keep router firmware updated, and use strong Wi-Fi encryption (WPA2/WPA3). A home network is effectively an extension of your workplace's security perimeter when you're working remotely.",
        ],
      },
      {
        heading: 'Keep work and personal separate',
        body: [
          'Avoid using your personal computer for work tasks, or your work computer for personal browsing and downloads, wherever policy allows a clean separation. This limits how a compromise in one area can spread to the other.',
        ],
      },
      {
        heading: 'Be mindful of what\'s visible on video calls',
        body: [
          'Screens, whiteboards, and documents visible in your video call background can inadvertently expose sensitive information. A quick check of your surroundings before joining a call is a simple, effective habit.',
        ],
      },
    ],
    key_takeaways: [
      "Your home network security matters just as much as office network security when working remotely.",
      'Keep work and personal devices/accounts separate wherever possible.',
      'Check your video call background for sensitive or embarrassing visible information.',
    ],
  },
  {
    title: 'Recognizing Fake Software Update Prompts',
    summary: 'Not every "update now" pop-up is what it claims to be.',
    minutes: 3,
    sections: [
      {
        heading: 'How fake updates work',
        body: [
          "A fake update prompt mimics the look of a real operating system or browser update notification, but actually installs malware when clicked. These are especially common on compromised or ad-heavy websites.",
        ],
      },
      {
        heading: 'Update through the source, not the prompt',
        body: [
          "If you see an update prompt while browsing, close the browser tab entirely and check for updates directly within the application's own settings or your device's system settings, rather than clicking anything in the pop-up itself.",
        ],
      },
      {
        heading: 'Let IT manage software updates where possible',
        body: [
          "On company devices, software updates are often centrally managed by IT. An unexpected update prompt appearing outside of that normal process is worth treating with suspicion and reporting if you're unsure.",
        ],
      },
    ],
    key_takeaways: [
      'Fake update pop-ups are a common way to trick people into installing malware.',
      "Always update software through its own settings or your system settings, never through a pop-up.",
      'Report unexpected update prompts on company devices to IT.',
    ],
  },
  {
    title: 'QR Code Phishing (Quishing)',
    summary: 'QR codes hide their destination until it\'s too late to check first — learn to treat them with the same caution as links.',
    minutes: 3,
    sections: [
      {
        heading: 'Why QR codes are risky',
        body: [
          "A QR code can't be visually inspected the way a text link can — you don't know where it leads until after you've already scanned it and your phone has opened the destination. Attackers exploit this by embedding QR codes in emails, flyers, or even stickers placed over legitimate ones.",
        ],
      },
      {
        heading: 'Treat scanning like clicking',
        body: [
          "Apply the same skepticism to an unexpected QR code that you would to an unexpected link: who sent it, were you expecting it, and does the context make sense? Many phone cameras show a preview of the destination URL before opening it — always check that preview.",
        ],
      },
      {
        heading: 'Be extra cautious with physical QR codes',
        body: [
          'A QR code sticker placed over a real one (on a parking sign, a poster, a payment terminal) is a known real-world tactic. If a physical QR code looks like it could have been tampered with or placed on top of something else, avoid scanning it.',
        ],
      },
    ],
    key_takeaways: [
      "QR codes hide their destination until after you've already scanned them.",
      "Check the URL preview your phone shows before letting it open fully.",
      'Be cautious of QR codes that could have been physically placed over a legitimate one.',
    ],
  },
  {
    title: 'Building a Security-First Mindset',
    summary: 'Wrapping up: the habits from this training only help if they become second nature.',
    minutes: 3,
    sections: [
      {
        heading: 'Slow down by default',
        body: [
          "Almost every scenario in this training relies on the same trick: creating urgency so you act before thinking. The single most powerful habit you can build is pausing, even for a few seconds, whenever a message pushes you to act immediately.",
        ],
      },
      {
        heading: 'It\'s everyone\'s job, not just IT\'s',
        body: [
          "Security teams can build strong defenses, but a single click by any one person can bypass a lot of them. Treating security awareness as part of your own job, not something delegated entirely to IT, is what actually keeps an organization safe.",
        ],
      },
      {
        heading: 'Keep reporting, even after this training',
        body: [
          "The habits covered here — checking senders, hovering over links, verifying unusual requests, reporting suspicious messages — matter most when they're applied consistently, long after a training like this one is finished.",
        ],
      },
    ],
    key_takeaways: [
      'Pausing before acting on urgent requests defeats most of the tactics covered in this training.',
      "Security is everyone's responsibility, not just an IT function.",
      'Keep applying these habits consistently, not just right after completing training.',
    ],
  },
];

async function main() {
  const [{ data: existingSims }, { data: existingLessonIds }, { data: lastLesson }] = await Promise.all([
    supabase.from('simulations').select('id'),
    supabase.from('lessons').select('id'),
    supabase.from('lessons').select('order_index').order('order_index', { ascending: false }).limit(1),
  ]);

  const takenSimIds = new Set((existingSims ?? []).map((s) => s.id));
  const takenLessonIds = new Set((existingLessonIds ?? []).map((l) => l.id));
  let nextOrderIndex = (lastLesson?.[0]?.order_index ?? 0) + 1;

  const simRows = NEW_SIMULATIONS.map((sim) => ({ ...sim, id: makeUniqueId('sim', sim.name, takenSimIds) }));
  const lessonRows = NEW_LESSONS.map((lesson) => ({
    ...lesson,
    id: makeUniqueId('lesson', lesson.title, takenLessonIds),
    order_index: nextOrderIndex++,
  }));

  const { error: simError } = await supabase.from('simulations').insert(simRows);
  if (simError) throw new Error(`Inserting simulations failed: ${simError.message}`);
  console.log(`Added ${simRows.length} simulations:`);
  simRows.forEach((s) => console.log(`  - ${s.id}: ${s.name} (${s.category}, ${s.difficulty})`));

  const { error: lessonError } = await supabase.from('lessons').insert(lessonRows);
  if (lessonError) throw new Error(`Inserting lessons failed: ${lessonError.message}`);
  console.log(`\nAdded ${lessonRows.length} lessons:`);
  lessonRows.forEach((l) => console.log(`  - ${l.id} (order ${l.order_index}): ${l.title}`));

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
