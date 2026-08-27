// The 6 compulsory training lessons, in the order employees must complete
// them. This used to be a hardcoded array in this file — now it's fetched
// from the real `lessons` table via Supabase's API (ordered by the
// `order_index` column, which replaces relying on array order), reshaped
// into the same {id, title, summary, minutes, sections, keyTakeaways}
// fields every page already expects.
import { supabase } from '../lib/supabaseClient';

function shapeLesson(row) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    minutes: row.minutes,
    sections: row.sections,
    keyTakeaways: row.key_takeaways,
  };
}

export async function fetchLessons() {
  const { data, error } = await supabase.from('lessons').select('*').order('order_index');
  if (error) throw new Error(error.message);
  return (data ?? []).map(shapeLesson);
}
