// Builds the "Activity Log" shown on the Profile page by combining two
// separate sources — simulation results and training progress — into one
// single, time-ordered list, straight from the database. Neither of those
// two features knows about the other; this file is what merges them
// together for display.
import { supabase } from '../lib/supabaseClient';

// Turns the short action code ("click") into a readable verb ("clicked
// the link/attachment in") for the activity sentence.
const ACTION_COPY = {
  report: 'reported',
  click: 'clicked the link/attachment in',
  ignore: 'ignored',
};

// Gathers every simulation result and every completed lesson for one
// person, turns each into a plain sentence + icon + color, and returns
// them sorted so the most recent activity is first. Uses Supabase's
// foreign-key embedding (`simulations(name)`) to pull in each item's
// display name in the same query, instead of a separate round trip.
export async function getActivityLog(userId) {
  const [{ data: simRows, error: simErr }, { data: lessonRows, error: lessonErr }] = await Promise.all([
    supabase.from('sim_results').select('*, simulations(name)').eq('user_id', userId),
    supabase.from('training_progress').select('*, lessons(title)').eq('user_id', userId),
  ]);
  if (simErr) throw new Error(simErr.message);
  if (lessonErr) throw new Error(lessonErr.message);

  const items = [];

  for (const row of simRows ?? []) {
    const passed = row.status === 'passed';
    items.push({
      id: `sim_${row.sim_id}`,
      icon: passed ? 'material-symbols:check-circle' : 'material-symbols:error',
      color: passed ? 'emerald' : 'red',
      text: `${passed ? 'Passed' : 'Failed'} the "${row.simulations?.name ?? row.sim_id}" simulation — you ${ACTION_COPY[row.action] ?? row.action} it.`,
      timestamp: row.completed_at,
    });
  }

  for (const row of lessonRows ?? []) {
    items.push({
      id: `lesson_${row.lesson_id}`,
      icon: 'material-symbols:school',
      color: 'blue',
      text: `Completed the "${row.lessons?.title ?? row.lesson_id}" training lesson.`,
      timestamp: row.completed_at,
    });
  }

  // Newest activity first.
  return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Converts a stored date/time into a friendly phrase like "5 minutes ago",
// "Yesterday", or "3 days ago" — falling back to a plain date once
// something is more than a week old.
export function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(isoString).toLocaleDateString();
}
