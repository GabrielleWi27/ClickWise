// One-off script: creates the 3 demo organizations plus real Supabase Auth
// users for their admins/employees, and one ClickWise platform-admin
// account, so an evaluator can log into every role right away.
//
// Members join by email domain now (see migration 0003_domain_join.sql),
// so the order here matters: each org's ADMIN account is created FIRST
// (before the organization row exists, so the domain-matching trigger
// has nothing to match and correctly makes them an org_admin), THEN the
// organization row is created claiming that domain, THEN employee
// accounts are created (the domain now matches, so the trigger
// auto-joins them as employees — no manual linking needed).
//
// Uses the SERVICE ROLE key (bypasses RLS + creates auth users directly),
// so this must only ever be run from a trusted machine, never in the browser.
//
// Usage:
//   1. Fill in VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in your .env
//   2. node supabase/seed-scripts/seedDemoData.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_ORGS = [
  {
    name: 'CloudShield Ltd.',
    domain: 'cloudshield.io',
    planId: 'enterprise',
    admin: { name: 'Wanjiru Kamau', email: 'wanjiru@cloudshield.io' },
    employees: [
      { name: 'Tom Reid', email: 'tom.reid@cloudshield.io', department: 'Engineering', riskScore: 22 },
      { name: 'Alice Nyong', email: 'alice.nyong@cloudshield.io', department: 'Sales', riskScore: 58 },
    ],
  },
  {
    name: 'Nova Bank',
    domain: 'novabank.co.ke',
    planId: 'professional',
    admin: { name: 'David Otieno', email: 'david.otieno@novabank.co.ke' },
    employees: [{ name: 'Grace Wambui', email: 'grace.wambui@novabank.co.ke', department: 'Finance', riskScore: 34 }],
  },
  {
    name: 'Defense.io',
    domain: 'defense.io',
    planId: 'starter',
    admin: { name: 'Leo Marchetti', email: 'leo@defense.io' },
    employees: [],
  },
];

const DEMO_PASSWORD = 'ClickWiseDemo123!';

// Creates a real Supabase Auth user (role/org come from the domain-matching
// trigger — see the module comment above), and backfills anything the
// trigger doesn't set (department, a starting risk score).
async function createDemoUser({ email, name, department, riskScore }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw new Error(`Creating ${email} failed: ${error.message}`);

  const userId = data.user.id;
  if (department || riskScore != null) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ department: department ?? null, risk_score: riskScore ?? null })
      .eq('id', userId);
    if (updateError) throw new Error(`Updating profile for ${email} failed: ${updateError.message}`);
  }
  return userId;
}

async function main() {
  console.log('Seeding platform admin...');
  await createDemoUser({ email: 'admin@clickwise.io', name: 'ClickWise Staff' });

  for (const org of DEMO_ORGS) {
    console.log(`Admin: ${org.admin.email}`);
    const adminId = await createDemoUser({ ...org.admin, department: 'Leadership' });

    console.log(`Creating organization: ${org.name} (${org.domain})`);
    const { data: plan } = await supabase.from('plans').select('seat_limit').eq('id', org.planId).single();
    const { data: orgRow, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: org.name, plan_id: org.planId, seat_limit: plan?.seat_limit ?? null, domain: org.domain })
      .select()
      .single();
    if (orgError) throw new Error(`Creating org ${org.name} failed: ${orgError.message}`);

    await supabase.from('profiles').update({ org_id: orgRow.id }).eq('id', adminId);

    for (const employee of org.employees) {
      console.log(`  Employee: ${employee.email}`);
      await createDemoUser(employee);
    }
  }

  console.log('\nDone. Every demo account password is:', DEMO_PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
