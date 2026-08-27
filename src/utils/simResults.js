// Keeps track of how each person did on their phishing simulations, via
// the real `sim_results` table (Row Level Security makes sure everyone
// can only write their own rows, and only org_admins/platform_admins can
// read anyone else's).
import { supabase } from '../lib/supabaseClient';

// Reads a person's saved simulation results, keyed by simulation id —
// e.g. { sim_password_reset: { status, action, completedAt } }.
export async function loadResults(userId) {
  const { data, error } = await supabase.from('sim_results').select('*').eq('user_id', userId);
  if (error) throw new Error(error.message);
  const results = {};
  for (const row of data ?? []) {
    results[row.sim_id] = { status: row.status, action: row.action, completedAt: row.completed_at };
  }
  return results;
}

// Records the outcome of one simulation attempt (passed/failed, which
// action they took). `upsert` means: insert it if this is their first
// attempt, or overwrite their previous attempt if they're retrying.
export async function saveResult(userId, simId, { status, action }) {
  const { error } = await supabase
    .from('sim_results')
    .upsert(
      { user_id: userId, sim_id: simId, status, action, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,sim_id' }
    );
  if (error) throw new Error(error.message);
}

// Turns a results object (from loadResults) into the summary numbers shown
// on the Dashboard/Simulations pages: how many completed, how many
// passed/failed, pass rate, and a simple "risk score" (higher = failed
// more often). Everything is `null` until at least one is completed, so
// the UI can show "—" instead of a misleading 0%.
export function computeStats(results, totalCount) {
  const entries = Object.values(results);
  const completed = entries.length;
  const passed = entries.filter((r) => r.status === 'passed').length;
  const failed = completed - passed;
  const passRate = completed === 0 ? null : Math.round((passed / completed) * 100);
  const riskScore = completed === 0 ? null : Math.round(((failed / completed) * 100) * 0.8);
  return { completed, passed, failed, total: totalCount, passRate, riskScore };
}
