// Keeps track of which training lessons each person has finished, and
// enforces the "must complete lessons in order" rule — via the real
// `training_progress` table instead of local storage.
import { supabase } from '../lib/supabaseClient';

// Reads which lessons a person has completed so far, keyed by lesson id.
export async function loadProgress(userId) {
  const { data, error } = await supabase.from('training_progress').select('*').eq('user_id', userId);
  if (error) throw new Error(error.message);
  const progress = {};
  for (const row of data ?? []) {
    progress[row.lesson_id] = { completedAt: row.completed_at };
  }
  return progress;
}

// Marks one lesson as finished.
export async function markComplete(userId, lessonId) {
  const { error } = await supabase
    .from('training_progress')
    .upsert({ user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' });
  if (error) throw new Error(error.message);
}

// Turns a progress object (from loadProgress) into the numbers shown on
// the progress bar: how many lessons are done, what percent that is, and
// whether every lesson is finished (isDone).
export function computeProgress(progress, totalCount) {
  const completed = Object.keys(progress).length;
  return {
    completed,
    total: totalCount,
    percent: totalCount === 0 ? 0 : Math.round((completed / totalCount) * 100),
    isDone: completed >= totalCount,
  };
}

// This is what makes training "compulsory in order": a lesson is only
// unlocked if every lesson BEFORE it in the list has already been
// completed. The very first lesson (index 0) is always unlocked.
export function isLessonUnlocked(progress, lessons, lessonId) {
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index <= 0) return true;
  return lessons.slice(0, index).every((l) => !!progress[l.id]);
}

// A simulation is only unlocked once its paired training lesson has been
// completed — simulations with no `requiredLessonId` are always unlocked.
export function isSimulationUnlocked(progress, sim) {
  if (!sim.requiredLessonId) return true;
  return !!progress[sim.requiredLessonId];
}
