// The simulated phishing emails employees can practice on. This used to
// be a hardcoded array in this file — now it's fetched from the real
// `simulations` table via Supabase's API, and reshaped into the same
// {id, name, category, difficulty, sender, subject, body, ctaLabel, redFlags}
// fields every page already expects, so page code barely had to change.
// Each simulation also names a `requiredLessonId` — the training lesson
// that must be completed before this simulation can be attempted.
import { supabase } from '../lib/supabaseClient';

function shapeSimulation(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    difficulty: row.difficulty,
    sender: row.sender,
    subject: row.subject,
    body: row.body,
    ctaLabel: row.cta_label,
    redFlags: row.red_flags,
    requiredLessonId: row.required_lesson_id,
    active: row.active,
  };
}

export async function fetchSimulations() {
  const { data, error } = await supabase.from('simulations').select('*').order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []).map(shapeSimulation);
}
