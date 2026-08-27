// Computes real, live numbers for an org's dashboard — overall risk score,
// each member's own risk score, training completion rate, and a recent
// activity feed — all from actual sim_results/training_progress rows.
// Nothing here is hardcoded or guessed; an org with no activity yet just
// gets `null`/empty results instead of a fake placeholder number.
import { supabase } from '../lib/supabaseClient';
import { fetchAllPages } from './fetchAll';

// The main function this file exports — everything an org's dashboard
// needs, computed fresh from the database every time it's called.
export async function fetchOrgIntelligence(orgId, { lessonCount = 0 } = {}) {
  // A safe "nothing to show yet" shape, reused for orgs with no id or no members.
  const empty = { overallRiskScore: null, riskScoreByMember: {}, recentActivity: [], trainingCompletionRate: null };
  if (!orgId) return empty;

  // Who's in this org, and their simulation/training rows — fetched
  // together (Promise.all) since neither query depends on the other.
  const { data: members } = await supabase.from('profiles').select('id, name').eq('org_id', orgId);
  const memberIds = (members ?? []).map((m) => m.id);
  if (memberIds.length === 0) return empty;

  // Paginated (see fetchAll.js) — a plain unranged .select() silently
  // truncates at 1,000 rows, which a large organization like this one
  // blows straight past.
  const [simRows, progressRows] = await Promise.all([
    fetchAllPages((from, to) =>
      supabase.from('sim_results').select('*, simulations(name)').in('user_id', memberIds).range(from, to)
    ),
    fetchAllPages((from, to) =>
      supabase.from('training_progress').select('*, lessons(title)').in('user_id', memberIds).range(from, to)
    ),
  ]);

  // Quick lookup table: member id -> member name, used below when
  // building the human-readable activity feed.
  const nameById = Object.fromEntries((members ?? []).map((m) => [m.id, m.name]));

  // Overall + per-member risk score — same "failed / completed * 100 *
  // 0.8" formula used on the Simulations and Reports pages, just grouped
  // by member here as well as summed across the whole org.
  const rowsByMember = {};
  for (const row of simRows ?? []) {
    rowsByMember[row.user_id] ??= [];
    rowsByMember[row.user_id].push(row);
  }
  const riskScoreByMember = {};
  for (const [userId, rows] of Object.entries(rowsByMember)) {
    const failed = rows.filter((r) => r.status === 'failed').length;
    riskScoreByMember[userId] = Math.round((failed / rows.length) * 100 * 0.8);
  }
  const totalCompleted = (simRows ?? []).length;
  const totalFailed = (simRows ?? []).filter((r) => r.status === 'failed').length;
  const overallRiskScore = totalCompleted ? Math.round((totalFailed / totalCompleted) * 100 * 0.8) : null;

  // Training completion rate: the % of this org's members who have
  // finished every single lesson.
  let trainingCompletionRate = null;
  if (lessonCount > 0) {
    const progressCountByMember = {};
    for (const row of progressRows ?? []) {
      progressCountByMember[row.user_id] = (progressCountByMember[row.user_id] ?? 0) + 1;
    }
    const doneCount = memberIds.filter((id) => (progressCountByMember[id] ?? 0) >= lessonCount).length;
    trainingCompletionRate = Math.round((doneCount / memberIds.length) * 100);
  }

  // Recent activity: merge both real sources into one feed, newest first.
  const recentActivity = [
    ...(simRows ?? []).map((r) => ({
      id: `sim_${r.id}`,
      icon: r.status === 'passed' ? 'material-symbols:check-circle' : 'material-symbols:cancel',
      color: r.status === 'passed' ? 'emerald' : 'red',
      text: `${nameById[r.user_id] ?? 'A team member'} ${r.status === 'passed' ? 'passed' : 'failed'} the "${r.simulations?.name ?? r.sim_id}" simulation`,
      timestamp: r.completed_at,
    })),
    ...(progressRows ?? []).map((r) => ({
      id: `lesson_${r.id}`,
      icon: 'material-symbols:school',
      color: 'blue',
      text: `${nameById[r.user_id] ?? 'A team member'} completed "${r.lessons?.title ?? r.lesson_id}"`,
      timestamp: r.completed_at,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 6);

  return { overallRiskScore, riskScoreByMember, recentActivity, trainingCompletionRate };
}
