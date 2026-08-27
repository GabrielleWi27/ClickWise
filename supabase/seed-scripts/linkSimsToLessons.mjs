// One-off script: sets each simulation's `required_lesson_id` to the
// lesson that teaches how to spot it. Run once after 0007_sim_requires_lesson.sql.
//
// Usage:
//   node supabase/seed-scripts/linkSimsToLessons.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

// simulation id -> the lesson id that must be completed first
const REQUIRED_LESSON = {
  sim_password_reset: 'lesson_inspect_links',
  sim_invoice: 'lesson_spot_phishing',
  sim_delivery: 'lesson_understanding-ransomware',
  sim_hr_payroll: 'lesson_passwords_mfa',
  sim_bonus: 'lesson_social_engineering',
  sim_it_verification: 'lesson_reporting',

  'sim_executive-wire-transfer-request': 'lesson_recognizing-business-email-compromise-bec',
  'sim_vendor-bank-details-update': 'lesson_vendor-and-third-party-risk-awareness',
  'sim_mfa-approval-spam': 'lesson_passwords_mfa',
  'sim_shared-document-notification': 'lesson_safe-file-sharing-and-cloud-storage',
  'sim_charity-donation-match': 'lesson_social_engineering',
  'sim_expense-report-rejected': 'lesson_inspect_links',
  'sim_new-hire-onboarding-checklist': 'lesson_spot_phishing',
  'sim_voicemail-transcription': 'lesson_inspect_links',
  'sim_software-license-expiring': 'lesson_recognizing-fake-software-update-prompts',
  'sim_survey-reward-gift-card': 'lesson_social_engineering',
  'sim_contract-signature-request': 'lesson_inspect_links',
  'sim_qr-code-parking-validation': 'lesson_qr-code-phishing-quishing',
};

async function main() {
  const { data: lessons } = await supabase.from('lessons').select('id');
  const validLessonIds = new Set((lessons ?? []).map((l) => l.id));

  let updated = 0;
  for (const [simId, lessonId] of Object.entries(REQUIRED_LESSON)) {
    if (!validLessonIds.has(lessonId)) {
      console.warn(`Skipping ${simId}: lesson "${lessonId}" not found.`);
      continue;
    }
    const { error } = await supabase.from('simulations').update({ required_lesson_id: lessonId }).eq('id', simId);
    if (error) {
      console.warn(`Skipping ${simId}: ${error.message}`);
      continue;
    }
    console.log(`${simId} -> ${lessonId}`);
    updated += 1;
  }

  console.log(`\nDone. Linked ${updated} simulations to a required lesson.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
