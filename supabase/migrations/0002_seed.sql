-- Seed data for ClickWise — the shared reference data every org can see.
-- Run this after 0001_init.sql. Safe to re-run (uses ON CONFLICT DO NOTHING).

-- ===== plans =====
insert into plans (id, name, description, price_ksh, recommended, seat_limit, features) values
  ('starter', 'Starter', 'Ideal for small teams looking to baseline human risk.', 19000, false, 100,
    array['Up to 100 Employees', 'Monthly Phishing Tests', 'Core Training Module']),
  ('professional', 'Professional', 'Advanced automation for high-growth organizations.', 64000, true, 1000,
    array['Up to 1,000 Employees', 'AI-Driven Campaigns', 'Targeted Adaptive Training', 'Risk Scoring API']),
  ('enterprise', 'Enterprise', 'Full-spectrum security for large-scale enterprises.', 129000, false, null,
    array['Unlimited Users', 'Dedicated Success Manager', 'Custom Compliance Reports'])
on conflict (id) do nothing;

-- ===== content library =====
insert into content_library (id, type, name, category, difficulty, active) values
  (gen_random_uuid(), 'campaign', 'Password Reset', 'Credential Harvest', 'High', true),
  (gen_random_uuid(), 'campaign', 'Invoice / Payment', 'Financial Lure', 'Medium', true),
  (gen_random_uuid(), 'campaign', 'Delivery Notification', 'Attachment Bait', 'Medium', true),
  (gen_random_uuid(), 'campaign', 'HR / Payroll', 'Credential Harvest', 'High', true),
  (gen_random_uuid(), 'campaign', 'Year-End Bonus Lure', 'Financial Lure', 'Low', false),
  (gen_random_uuid(), 'demo', 'Platform Walkthrough', 'Sales Demo', 'Low', true),
  (gen_random_uuid(), 'demo', 'Admin Dashboard Tour', 'Onboarding Demo', 'Low', true),
  (gen_random_uuid(), 'training', 'Social Engineering Level 2', 'Core Curriculum', 'Medium', true),
  (gen_random_uuid(), 'training', 'Credential Hygiene Basics', 'Core Curriculum', 'Low', true);

-- ===== simulations =====
insert into simulations (id, name, category, difficulty, sender, subject, body, cta_label, red_flags) values
(
  'sim_password_reset', 'Password Reset Alert', 'Credential Harvest', 'High',
  'IT Support <support@clickw1se-portal.com>',
  'Action Required: Your password expires in 24 hours',
  array[
    'Dear Employee,',
    'Our records indicate your network password will expire in 24 hours. To avoid disruption to your account access, please verify your credentials immediately using the secure link below.',
    'Failure to do so will result in account suspension.',
    'IT Support Team'
  ],
  'Click "Verify My Password"',
  array[
    'Sender domain "clickw1se-portal.com" is not the real company domain (note the "1" instead of "i").',
    'Creates false urgency with a 24-hour deadline and threat of suspension.',
    'Asks you to "verify credentials" via an email link instead of your normal login page.'
  ]
),
(
  'sim_invoice', 'Unpaid Invoice Notice', 'Financial Lure', 'Medium',
  'Billing Dept <billing@globalvendor-invoices.net>',
  'Invoice #48213 Overdue - Immediate Payment Required',
  array[
    'Hello,',
    'Invoice #48213 for $4,850.00 is now 15 days overdue. Please review the attached invoice and remit payment immediately to avoid service interruption.',
    'Thank you,',
    'Billing Department'
  ],
  'Open the attached "Invoice_48213.pdf"',
  array[
    'An unfamiliar vendor domain you don''t recognize doing business with.',
    'Generic greeting ("Hello") instead of your actual name.',
    'Pressure to open an attachment urgently to avoid "service interruption."'
  ]
),
(
  'sim_delivery', 'Package Delivery Failed', 'Attachment Bait', 'Medium',
  'Delivery Services <no-reply@swift-parcel-delivery.com>',
  'We missed you! Reschedule your delivery',
  array[
    'We attempted to deliver your package today but no one was available.',
    'To reschedule, please confirm your delivery details using the attached form.',
    'Swift Parcel Delivery'
  ],
  'Open "Delivery_Form.exe"',
  array[
    'The attachment is an .exe program file, not a shipping label or form.',
    'You don''t recall ordering anything requiring delivery.',
    'Unfamiliar courier name you haven''t used before.'
  ]
),
(
  'sim_hr_payroll', 'HR Payroll Update', 'Credential Harvest', 'High',
  'HR Team <hr-payroll@clickwise-hr-portal.com>',
  'Update your direct deposit information by Friday',
  array[
    'Hi Team,',
    'We''re migrating to a new payroll system. Please log in and confirm your direct deposit details by Friday to avoid a delay in your next paycheck.',
    'HR Team'
  ],
  'Click "Update My Bank Details"',
  array[
    'Login domain differs from your real company HR system.',
    'Threatens a delayed paycheck to pressure quick action.',
    'Requests sensitive bank details through an email link rather than the real HR portal.'
  ]
),
(
  'sim_bonus', 'Year-End Bonus Notice', 'Financial Lure', 'Low',
  'Executive Office <ceo-office@clickwise-announcements.com>',
  'You''ve been selected for a year-end bonus!',
  array[
    'Congratulations!',
    'You have been selected to receive a special year-end bonus of $500. Click below to claim your reward before it expires at midnight.',
    'Executive Office'
  ],
  'Click "Claim My Bonus"',
  array[
    'An unusually generous, unexpected reward designed to create excitement and bypass caution.',
    'An artificial expiration deadline ("expires at midnight").',
    'Executives don''t typically email bonus payouts directly with a claim link.'
  ]
),
(
  'sim_it_verification', 'Urgent IT Security Verification', 'Credential Harvest', 'High',
  'IT Security <security-alert@clickwise-secure-verify.com>',
  'Suspicious sign-in attempt detected on your account',
  array[
    'We detected a sign-in attempt from an unrecognized device. If this wasn''t you, verify your identity immediately to secure your account.',
    'If you don''t verify within 1 hour, your account will be locked.',
    'IT Security Team'
  ],
  'Click "Verify My Identity"',
  array[
    'Creates fear and urgency about a compromised account.',
    'The verification link domain differs from your real IT security portal.',
    'A 1-hour countdown is designed to rush your decision before you think it through.'
  ]
)
on conflict (id) do nothing;

-- ===== lessons =====
insert into lessons (id, order_index, title, summary, minutes, sections, key_takeaways) values
(
  'lesson_spot_phishing', 1, 'How to Spot a Phishing Email',
  'Learn the six most common red flags that give phishing emails away.', 1,
  '[
    {"heading": "Check the sender, not just the display name", "body": ["Email clients show a friendly display name (\"IT Support\") by default, but attackers rely on you never checking the actual address behind it. Before trusting a message, look at the full sender address for misspelled domains (clickw1se-portal.com instead of clickwise.com), extra subdomains, or a completely unrelated domain."]},
    {"heading": "False urgency and threats", "body": ["Phishing emails almost always create pressure to act immediately: an account expiring in 24 hours, a suspended payment, a locked account. Legitimate organizations rarely demand instant action over email. Urgency is a manipulation tactic designed to stop you from thinking it through."]},
    {"heading": "Generic greetings", "body": ["\"Dear Customer\" or \"Hello\" instead of your actual name is a sign the sender doesn''t have a real relationship with you — real companies you do business with almost always use your name."]},
    {"heading": "Suspicious links", "body": ["Hover over any link before clicking (see Lesson 2 for detail). Watch for links that don''t match the text describing them, shortened URLs, or domains that are almost — but not quite — the real thing."]},
    {"heading": "Unexpected attachments", "body": ["An invoice, delivery form, or resume you weren''t expecting is a classic malware delivery method. Be especially cautious of .exe, .zip, .js, or macro-enabled Office files (.docm, .xlsm)."]},
    {"heading": "Requests for sensitive information", "body": ["No legitimate IT team, bank, or vendor will ask you to \"verify\" your password, MFA code, or bank details by replying to an email or clicking a link. When in doubt, go directly to the real site or app yourself instead of using the link provided."]}
  ]'::jsonb,
  array[
    'Always check the full sender address, not just the display name.',
    'Urgency and threats are manipulation tactics — slow down.',
    'Generic greetings are a warning sign.',
    'Hover over links before clicking to preview the real destination.',
    'Don''t open unexpected attachments, even from familiar-looking senders.',
    'No legitimate service asks you to "verify" credentials via email link.'
  ]
),
(
  'lesson_inspect_links', 2, 'Inspecting Links Before You Click',
  'Master the habit of previewing a link''s real destination before you trust it.', 4,
  '[
    {"heading": "Hover, don''t click", "body": ["On desktop, hovering your mouse over a link (without clicking) shows the actual destination URL, usually in the bottom corner of your browser or email client. On mobile, a long-press usually reveals the same preview. Make this a reflex before clicking anything in an email."]},
    {"heading": "Look-alike domains (typosquatting)", "body": ["Attackers register domains that look almost identical to the real one: clickw1se.com (number 1 instead of letter i), click-wise-security.com (extra words), or clickwise.co (wrong top-level domain). Read the domain character by character, especially right before the first single slash."]},
    {"heading": "URL shorteners hide the destination", "body": ["Shortened links (bit.ly, tinyurl, etc.) can point anywhere, and you can''t tell where until you click — which defeats the purpose of checking first. Treat any shortened link in an unsolicited email with extra suspicion, and use a link-expander tool if you need to check one."]},
    {"heading": "HTTPS is not proof of safety", "body": ["A padlock icon only means the connection is encrypted — it says nothing about whether the site itself is trustworthy. Attackers can and do get valid HTTPS certificates for their fake login pages. Don''t let the padlock alone convince you a page is legitimate."]}
  ]'::jsonb,
  array[
    'Hover or long-press to preview a link before clicking it.',
    'Read domains character by character — look-alikes are designed to be missed at a glance.',
    'Treat shortened links in unsolicited emails with extra suspicion.',
    'A padlock/HTTPS icon does not mean a site is legitimate.'
  ]
),
(
  'lesson_passwords_mfa', 3, 'Strong Passwords & Multi-Factor Authentication',
  'Build habits that keep a single stolen password from becoming a full account takeover.', 5,
  '[
    {"heading": "Length beats complexity", "body": ["A long passphrase (\"correct-horse-battery-staple-42\") is harder to crack than a short, complex-looking password (\"P@ss1!\") and easier for you to remember. Aim for 14+ characters wherever a service allows it."]},
    {"heading": "Never reuse passwords across accounts", "body": ["If one service you use is breached, attackers immediately try that same email/password combination on banks, email providers, and workplace systems — a technique called credential stuffing. A unique password per account contains the damage to just that one account."]},
    {"heading": "Use a password manager", "body": ["You can''t realistically memorize dozens of unique, long passwords — a password manager can, and will auto-fill them only on the real site''s domain, which is itself a phishing defense: it simply won''t offer to fill your password into a look-alike site."]},
    {"heading": "Enable multi-factor authentication (MFA) everywhere", "body": ["MFA means a stolen password alone isn''t enough to log in — the attacker also needs your phone, authenticator app, or security key. Enable it on your email, work accounts, and anything financial first, since compromising those often unlocks everything else."]},
    {"heading": "If a password is ever compromised", "body": ["Change it immediately on the affected service, then check whether you reused it anywhere else and change those too. Turn on MFA if you haven''t already, and report the incident to your IT/security team so they can watch for suspicious activity on your account."]}
  ]'::jsonb,
  array[
    'Prefer long passphrases over short, complex-looking passwords.',
    'Never reuse a password across more than one account.',
    'Use a password manager to generate and store unique passwords.',
    'Enable MFA on every account that offers it, starting with email and financial accounts.',
    'A compromised password should be changed immediately and reported.'
  ]
),
(
  'lesson_social_engineering', 4, 'Social Engineering Tactics to Watch For',
  'Phishing is only one form of a broader set of manipulation techniques — learn to recognize them all.', 4,
  '[
    {"heading": "Pretexting", "body": ["The attacker invents a believable scenario — \"I''m from IT, we''re migrating your account\" — to justify asking for information or access they shouldn''t have. The story is designed to sound routine enough that you don''t question it."]},
    {"heading": "Authority impersonation (CEO fraud / whaling)", "body": ["An email or message appears to come from an executive, urgently requesting a wire transfer, gift cards, or sensitive data. Attackers count on employees being reluctant to question a \"boss.\" Always verify unusual executive requests through a separate channel, like a phone call to a known number."]},
    {"heading": "Baiting", "body": ["An offer too good to pass up — a free gift, an unexpected bonus, exclusive access — lures you into clicking a link or downloading a file. The excitement of the reward is meant to override your usual caution."]},
    {"heading": "Tailgating and physical social engineering", "body": ["Not all social engineering happens over email — someone without a badge following closely behind you through a secure door, or a ''technician'' asking to be let into a server room, is using the same manipulation principles in person."]}
  ]'::jsonb,
  array[
    'Pretexting relies on a plausible-sounding story to justify an unusual request.',
    'Verify unexpected executive requests through a separate, known channel.',
    'An unusually generous, unexpected offer is a common lure.',
    'Social engineering happens in person too — never let someone into a secure area without proper verification.'
  ]
),
(
  'lesson_reporting', 5, 'What To Do If You Suspect Phishing',
  'The right response takes seconds and protects everyone else in your organization too.', 3,
  '[
    {"heading": "Don''t click, don''t reply", "body": ["Even replying \"unsubscribe\" or \"stop\" confirms to an attacker that your address is active and monitored, making you a target for future attempts. Simply don''t engage with the message at all."]},
    {"heading": "Verify through a separate channel", "body": ["If a message claims to be from a colleague, vendor, or service you use, contact them directly through a phone number or app you already know is real — never through contact details provided in the suspicious message itself."]},
    {"heading": "Report it immediately", "body": ["Use your organization''s \"Report Phishing\" button or forward it to your security team. Reporting is never embarrassing — it''s the single most useful thing you can do, since it lets your security team warn and protect everyone else who may have received the same email."]},
    {"heading": "Then delete it", "body": ["Once reported, delete the message so you (or anyone with access to your inbox) can''t accidentally interact with it later."]}
  ]'::jsonb,
  array[
    'Don''t click links, open attachments, or reply — even to unsubscribe.',
    'Verify suspicious requests through a channel you already trust, not one the message provides.',
    'Report every suspicious email — it protects your whole organization.',
    'Delete the message after reporting it.'
  ]
),
(
  'lesson_incident_response', 6, 'If You''ve Already Clicked: Incident Response',
  'Mistakes happen — what you do in the next five minutes matters most.', 4,
  '[
    {"heading": "Don''t panic, and don''t hide it", "body": ["The biggest mistake after clicking a phishing link isn''t the click itself — it''s staying quiet out of embarrassment. Every minute of delay gives an attacker more time to act. Security teams expect this to happen sometimes; they exist to help, not to blame."]},
    {"heading": "Disconnect if you entered credentials or downloaded a file", "body": ["If you can, disconnect the device from the network (turn off Wi-Fi, unplug the cable) to limit any malware''s ability to communicate or spread while you get help."]},
    {"heading": "Change your passwords immediately", "body": ["Starting with the account you believe was targeted, then any account that shares that password. Enable MFA on the affected account if it isn''t already on."]},
    {"heading": "Notify your IT/security team right away", "body": ["Tell them exactly what happened: what you clicked, what information (if any) you entered, and when. This lets them check logs, reset sessions, and watch for follow-on activity before it becomes a bigger incident."]},
    {"heading": "Keep an eye on your accounts", "body": ["Watch for unfamiliar logins, password reset emails you didn''t request, or unusual activity in the days that follow, and report anything unexpected right away."]}
  ]'::jsonb,
  array[
    'Report immediately — hiding a mistake is worse than the mistake itself.',
    'Disconnect the device from the network if credentials or files were involved.',
    'Change affected passwords immediately and enable MFA.',
    'Give your security team the full, honest details so they can respond effectively.',
    'Monitor your accounts for follow-on suspicious activity afterward.'
  ]
)
on conflict (id) do nothing;
