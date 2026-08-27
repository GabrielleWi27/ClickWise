// One-off script: creates the ONE permanent platform_admin (ClickWise
// staff) account directly with a chosen password via the Supabase admin
// API — required because a normal signUp() from the browser would only
// ever create the account for whoever is running the browser session,
// not let us set a specific password for someone else.
//
// Only run this once, unless the account needs to be recreated.
//
// Usage:
//   node supabase/seed-scripts/createPlatformAdmin.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const ADMIN_EMAIL = 'GabrielleHawi@clickwise.io';
const ADMIN_NAME = 'Gabrielle Hawi';
const ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('Missing PLATFORM_ADMIN_PASSWORD in your .env file.');
  process.exit(1);
}

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });
  if (error) throw new Error(error.message);

  console.log(`Created ${ADMIN_EMAIL}.`);

  // Confirm the trigger assigned the right role.
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  console.log('\nProfile created:', profile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
