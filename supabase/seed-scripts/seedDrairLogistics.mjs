// One-off script: creates "Drair Logistics" — an Org Admin (Andrew Ondiek)
// on the Starter plan, plus 99 employees (100 members total, exactly at
// Starter's 100-seat limit — Andrew + 100 employees would exceed it by 1,
// see the enforce_seat_limit trigger in 0001_init.sql).
//
// Every employee has: all 18 lessons completed, a passing final-quiz
// attempt, and a full set of 18 simulation results. Just over half (55)
// have a clean "passed everything" record; the rest (44) mostly failed
// their simulations (mixing "click"/"ignore" outcomes), with a handful of
// passes mixed in — representing employees who needed more than one try
// to start getting it right. (Note: sim_results only stores each
// employee's CURRENT result per simulation, not a history of past
// attempts, so "failed multiple times" is reflected as a low but nonzero
// pass rate for this group, not literal retry logs.)
//
// Uses the SERVICE ROLE key (bypasses RLS, creates real auth users), so
// this must only ever be run from a trusted machine, never in the browser.
//
// Usage:
//   1. Fill in VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in your .env
//   2. node supabase/seed-scripts/seedDrairLogistics.mjs
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

const DEMO_PASSWORD = 'ClickWiseDemo123!';
const DOMAIN = 'drairlogistics.co.ke';
const ORG_NAME = 'Drair Logistics';
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Legal', 'HR', 'Other'];

// 100 unique first names (one spare beyond the 99 needed) — every employee
// gets a first name nobody else in the roster has. Last names repeat
// (cycled from the 14-name pool below), which is realistic and fine;
// only first names need to be unique.
const FIRST_NAMES = [
  'James', 'Mary', 'Peter', 'Faith', 'Brian', 'Linda', 'Kevin', 'Diana', 'Samuel', 'Esther',
  'Victor', 'Joyce', 'Dennis', 'Irene', 'Michael', 'Grace', 'Daniel', 'Alice', 'Joseph', 'Wanjiru',
  'John', 'Catherine', 'Paul', 'Beatrice', 'Mark', 'Caroline', 'Anthony', 'Dorcas', 'Charles', 'Eunice',
  'Edwin', 'Florence', 'Felix', 'Gladys', 'George', 'Hellen', 'Hassan', 'Immaculate', 'Ibrahim', 'Jacinta',
  'Julius', 'Keziah', 'Kennedy', 'Lucy', 'Leonard', 'Margaret', 'Martin', 'Nancy', 'Nicholas', 'Olivia',
  'Oscar', 'Patricia', 'Patrick', 'Rose', 'Quentin', 'Sylvia', 'Robert', 'Teresa', 'Stephen', 'Ursula',
  'Timothy', 'Veronica', 'Vincent', 'Winnie', 'Walter', 'Yvonne', 'Xavier', 'Zipporah', 'Yusuf', 'Agnes',
  'Zachary', 'Bridget', 'Erick', 'Cynthia', 'Fredrick', 'Daisy', 'Gilbert', 'Edith', 'Henry', 'Rachel',
  'Isaac', 'Sarah', 'Jackson', 'Tabitha', 'Kelvin', 'Mercy', 'Lawrence', 'Naomi', 'Moses', 'Priscilla',
  'Nathan', 'Rebecca', 'Oliver', 'Susan', 'Phillip', 'Vivian', 'Raphael', 'Wendy', 'Simon', 'Yolanda',
];
const LAST_NAMES = ['Mwangi', 'Achieng', 'Kariuki', 'Njoroge', 'Otieno', 'Wafula', 'Kimani', 'Adhiambo', 'Barasa', 'Chebet', 'Muriuki', 'Nekesa', 'Odhiambo', 'Wanjala'];

if (new Set(FIRST_NAMES).size !== FIRST_NAMES.length) {
  throw new Error('FIRST_NAMES has a duplicate — every employee is supposed to get a unique first name.');
}

// 99 employees, each with a first name nobody else shares.
function buildEmployeeRoster() {
  return FIRST_NAMES.slice(0, 99).map((first, i) => {
    const last = LAST_NAMES[i % LAST_NAMES.length];
    return { name: `${first} ${last}`, email: `${first.toLowerCase()}.${last.toLowerCase()}@${DOMAIN}` };
  });
}

// A date `daysAgo` days in the past, as an ISO timestamp — used so
// completed_at values are spread out instead of all identical.
function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

// Inserts a large array of rows in chunks, rather than one giant request —
// safer against payload-size/timeout limits for the ~1,800-row tables below.
async function chunkInsert(table, rows, size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + size));
    if (error) throw new Error(`Inserting into ${table} failed: ${error.message}`);
  }
}

async function createAuthUser({ email, name }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw new Error(`Creating ${email} failed: ${error.message}`);
  return data.user.id;
}

async function main() {
  console.log(`Admin: andrew.ondiek@${DOMAIN}`);
  // Created BEFORE the organization exists, so the domain-matching trigger
  // has nothing to match yet and correctly makes Andrew an org_admin
  // (see migration 0003_domain_join.sql).
  const adminId = await createAuthUser({ name: 'Andrew Ondiek', email: `andrew.ondiek@${DOMAIN}` });
  await supabase.from('profiles').update({ department: 'Leadership' }).eq('id', adminId);

  console.log(`Creating organization: ${ORG_NAME} (${DOMAIN}), Starter plan`);
  const { data: plan } = await supabase.from('plans').select('seat_limit').eq('id', 'starter').single();
  const { data: orgRow, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: ORG_NAME, plan_id: 'starter', seat_limit: plan?.seat_limit ?? 100, domain: DOMAIN })
    .select()
    .single();
  if (orgError) throw new Error(`Creating org failed: ${orgError.message}`);
  await supabase.from('profiles').update({ org_id: orgRow.id }).eq('id', adminId);

  // The real, live content every employee needs to be marked "finished" against.
  const { data: lessons } = await supabase.from('lessons').select('id').order('order_index');
  const { data: simulations } = await supabase.from('simulations').select('id');
  console.log(`Found ${lessons.length} lessons and ${simulations.length} simulations to complete per employee.`);

  const roster = buildEmployeeRoster();
  const trainingRows = [];
  const quizRows = [];
  const simRows = [];

  console.log(`Creating ${roster.length} employees (this takes a while — one real auth account per employee)...`);
  for (let i = 0; i < roster.length; i++) {
    const employee = roster[i];
    const userId = await createAuthUser(employee);
    await supabase.from('profiles').update({ department: DEPARTMENTS[i % DEPARTMENTS.length] }).eq('id', userId);

    // Every employee finishes every lesson, spread across the last ~60 days.
    lessons.forEach((lesson, li) => {
      trainingRows.push({ user_id: userId, lesson_id: lesson.id, completed_at: daysAgo(60 - li * 3 - (i % 5)) });
    });

    // First 55 (of 99) are the "passed" group; the rest mostly failed.
    const isPasser = i < 55;
    let failedCount = 0;
    simulations.forEach((sim, si) => {
      // Passers: clean record. Strugglers: mostly fail, but ~1 in 3 pass —
      // "failed multiple times before getting right" on the ones they do pass.
      const passedThisOne = isPasser || (si + i) % 3 === 0;
      if (!passedThisOne) failedCount++;
      simRows.push({
        user_id: userId,
        sim_id: sim.id,
        status: passedThisOne ? 'passed' : 'failed',
        action: passedThisOne ? 'report' : si % 2 === 0 ? 'click' : 'ignore',
        completed_at: daysAgo(45 - si * 2 - (i % 4)),
      });
    });

    // A risk score matching their actual sim performance, same formula
    // used live throughout the app: (failed/total) * 100 * 0.8.
    const riskScore = Math.round((failedCount / simulations.length) * 100 * 0.8);
    await supabase.from('profiles').update({ risk_score: riskScore }).eq('id', userId);

    // Everyone eventually passes the compulsory final quiz.
    const score = 15 + (i % 4); // 15-18 out of 18 (83%-100%) — all clear the 80% bar
    quizRows.push({ user_id: userId, score, total: lessons.length, passed: true, completed_at: daysAgo(5 + (i % 10)) });

    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${roster.length} employees created...`);
  }

  console.log('Inserting training progress, quiz attempts, and simulation results...');
  await chunkInsert('training_progress', trainingRows);
  await chunkInsert('training_quiz_attempts', quizRows);
  await chunkInsert('sim_results', simRows);

  console.log('\nDone.');
  console.log(`Org: ${ORG_NAME} (${DOMAIN}) — Starter plan, 100/100 seats used`);
  console.log(`Admin: andrew.ondiek@${DOMAIN} / ${DEMO_PASSWORD}`);
  console.log(`Employees: 99, all training + quiz complete. 55 passed every simulation, 44 mostly failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
